require("setimmediate"); // polyfill for env != IE10+

/* global requestIdleCallback */
if (global.window) { // eslint-disable-line no-undef
	require("requestidlecallback"); // polyfill for env != Chrome46+
} else {
	global.requestIdleCallback = fn => {
		return setTimeout(() => {
			let deadline = Date.now() + 50;
			fn({
				timeRemaining: () => Math.max(0, deadline - Date.now()),
				didTimeout: false
			});
		}, 0);
	};
	global.cancelIdleCallback = handle => clearTimeout(handle);
}

let jsonop = require("jsonop"),
	OrderedArray = require("./OrderedArray"),
	RangeArray = require("./RangeArray"),
	{ keyToSlice } = require("./keyslice");

module.exports = class Cache {
	constructor(options) {
		options = jsonop({
			id: (entity) => { return entity.id; },
			is: (entity, type) => { return entity.type === type; }
		}, options || {});

		this.entities = {};
		this.indexes = {};
		this.queries = {};
		this.knowledge = {};
		this.app = {};

		/* map of types to index keys to index slices for fast lookup */
		this._types = {};
		this._changeListeners = [];
		this._queryCallbacks = {};
		this._recentQueries = { entities: {}};
		this._querySeqNum = 0;
		this._id = options.id;
		this._is = options.is;
		this._options = options;
	}

	/*
		Get index keys and corresponding values that must include this entity,
		taking into account knowledge for the same key.
		@param entity
		@returns { key: value }
	*/
	getKeyValues(entity) {
		let keyValues = {};

		for (let type in this._types) {
			if (!this._is(entity, type)) { continue; }
			keyloop:
			for (let key in this._types[type]) {
				let slice = this._types[type][key],
					value = entity[slice.order];

				if (typeof value === "undefined") { continue; }

				for (let prop in slice.filters) {
					if (entity[prop] !== slice.filters[prop]) {
						continue keyloop;
					}
				}
				if (this.knowledge[key].contains(value)) {
					keyValues[key] = value;
				}
			}
		}

		return keyValues;
	}

	/*
		Adds or updates an entity and updates indexes if necessary.
	*/
	putEntity(entity, excludeKeys) {
		let id = this._id(entity),
			oldKeyValues,
			newKeyValues;

		if (this.entities[id]) {
			oldKeyValues = this.getKeyValues(this.entities[id]);
			entity = jsonop(this.entities[id], entity);
		}
		this.entities[id] = entity;
		newKeyValues = this.getKeyValues(entity);

		if (oldKeyValues) {
			for (let key in oldKeyValues) {
				if (oldKeyValues[key] !== newKeyValues[key]) {
					this.indexes[key].delete(oldKeyValues[key]);
				} else {
					delete newKeyValues[key];
				}
			}
		}

		if (excludeKeys) { for (let key of excludeKeys) {
			delete newKeyValues[key];
		}}

		for (let key in newKeyValues) {
			this.indexes[key].put(entity);
		}

		return entity;
	}

	deleteEntity(id) {
		let keyValues = this.getKeyValues(this.entities[id]);
		for (let key in keyValues) {
			this.indexes[key].delete(keyValues());
		}
		delete this.entities[id];
	}

	putIndex(key, knowledge, items) {
		let removed;

		if (!this.knowledge[key]) {
			let slice = keyToSlice(key);
			this._types[slice.type] = this._types[slice.type] || {};
			this._types[slice.type][key] = slice;

			this.knowledge[key] = knowledge;
			this.indexes[key] = items;
			this.indexEntities(key);
		} else {
			for (let range of knowledge) {
				let rangeItems = items.slice(...range);
				removed.push(...this.indexes[key].splice(...range, rangeItems));
				this.knowledge[key].add(range);
			}

			if (removed) {
			/*	TODO: Use a hash join on id to diff removed with
				added, and call deleteEntity() on the remaining. */
			}
		}

		// insert all the items into entities, updating all indexes
		// except this one.
		for (let item of items) {
			this.putEntity(item, [ key ]);
		}

		if (this._queryCallbacks[key]) {
			for (let i in this._queryCallbacks[key]) {
				let { ranges, callback } = this._queryCallbacks[key][i];
				if (ranges.subtract(this.knowledge[key]).length === 0) {
					// No gaps in knowledge; query is satisfied.
					this.query(key, ranges[0], callback);
				}
			}
		}
	}

	/*
		Checks every entity for inclusion in a particular index. Called when a
		new index is created.
	*/
	indexEntities(key) {
		let slice = keyToSlice(key);
		for (let id in this.entities) {
			let entity = this.entities[id],
				value = entity[slice.order];
			if (typeof value !== "undefined") {
				this.indexes[key].put(entity);
			}
		}
		/* TODO: Rewrite for perf: use push() then sort() */
	}

	pruneEntities(deadline) {
		/* TODO: Implement in a nonblocking fashion */
	}

	/*
		Make changes to this cache (setState).
	*/
	put(changes) {
		/* handle the addition of ranges of results */
		if (changes.knowledge) { for (let key in changes.knowledge) {
			if (!(changes.knowledge[key] instanceof RangeArray)) {
				changes.knowledge[key] =
					new RangeArray(changes.knowledge[key]);
			}

			if (!(changes.indexes[key] instanceof OrderedArray)) {
				let { order } = keyToSlice(key);
				changes.indexes[key] =
					new OrderedArray(order, changes.indexes[key] || []);
			}

			this.putIndex(
				key, changes.knowledge[key], changes.indexes[key]
			);
		}}

		/* handle the addition of individual entities */
		if (changes.entities) { for (let id in changes.entities) {
			this.putEntity(changes.entities[id]);
		}}

		if (changes.app) { this.app = jsonop(this.app, changes.app); }

		/* handle the addition of a query */
		if (changes.query) { for (let key in changes.query) {
			if (!this.query[key]) {
				this.query[key] = changes.query[key];
			} else {
				for (let range in changes.query[key]) {
					this.query[key].add(range);
				}
			}
		}}

		/* if there are too many entities, clean up */
		if (Object.keys(this.entities).length > this._options.maxEntities) {
			requestIdleCallback(this.pruneEntities.bind(this));
		}
		this._changeListeners.forEach(fn => fn(changes));
	}

	query(key, range, callback) {
		let items, gaps, ranges = new RangeArray([ range ]);

		range.seqNum = this._querySeqNum++;

		/* Extract items and calculate gaps in knowledge */
		if (!this.knowledge[key]) {
			let { order } = keyToSlice(key);
			items = new OrderedArray(order, []);
			gaps = ranges;
		} else {
			items = this.indexes[key].slice(...range);
			gaps = (range.length === 3 ? items.getRange() : ranges)
				.difference(this.knowledge[key]);

			// If it is a before/after range, gaps will not show missing data at
			// start and end; we need to detect and correct this.

			// console.log(range.length, items.length, range[1] + range[2]);

			if (range.length === 3 && items.length < range[1] + range[2]) {
				let pos = items.indexOf(range[0]);

				if (pos < range[1]) { gaps.add([
					items[0][items.order], range[1] - pos
				]); }

				if (items.length - pos < range[2]) { gaps.add([
					items[items.length - 1][items.order],
					range[2] + pos - items.length
				]); }
			}
		}

		/* Insert “loading” placeholders corresponding to the gaps. */
		for (let gap of gaps) {
			items.put({
				type: "loading", start: gap[0], end: gap[1],
				[items.order]: gap[1] === RangeArray.END ? gap[1] : gap[0]
			});
		}

		/* Make queries corresponding to the gaps. */
		if (gaps.length) {
			this.put({ queries: { [key]: gaps }});
			if (callback) {
				this._queryCallbacks[key] = this._queryCallbacks[key] || [];
				this._queryCallbacks[key].push({ ranges, callback });
			}
		} else {
			if (callback) {
				setImmediate(() => callback(null, items));
			}
		}

		/* Update the most recently accessed map */
		if (!this._recentQueries[key]) {
			this._recentQueries[key] = items.getRange();
		} else {
			this._recentQueries[key].put(items.getRange());
		}

		return items;
	}

	onChange(fn) {
		this._changeListeners.push(fn);
	}

	get() {
		let args = Array.prototype.slice.call(arguments),
			pointer = this; // eslint-disable-line consistent-this

		while (typeof pointer === "object" && pointer !== null && args.length) {
			pointer = pointer[args.shift()];
		}

		return pointer;
	}

	getEntity(id) {
		this.recentQueries.entities[id] = this._querySeqNum++;
		return this.get(...([ "entities" ].concat(arguments)));
	}

	with(changes) {
		var cache = new Cache();
		cache.put({ app: jsonop(this.app, changes.app) });
		return cache;
	}
};
