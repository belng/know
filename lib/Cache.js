"use strict";

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
	keySlice  = require("./keyslice"),
	keyToSlice = keySlice.keyToSlice,
	sliceToKey = keySlice.sliceToKey;

module.exports = class Cache {
	constructor(options) {
		options = jsonop({
			id: (entity) => { return entity.id; },
			is: (entity, type) => { return entity.type === type; },
			entityOp: {},
			appOp: {}
		}, options || {});

		this.entities = {};
		this.indexes = {};
		this.queries = {};
		this.knowledge = {};
		this.app = {};
		this.keyToSlice = keyToSlice;
		this.sliceToKey = sliceToKey;

		/*
			map of types to index keys to index slices for fast lookup
			{
				items: {
					"items:createTime(tag:hidden)": { type: items, order: createTime, filters: { tag: hidden } }
				}
			}
		*/
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
			for (let key in this._types[type].base) {
				let slice = this._types[type].base[key],
					value = entity[slice.order];

				if (typeof value === "undefined") { continue; }

				for (let prop in slice.filters) {
					if (entity[prop] !== slice.filters[prop]) {
						continue keyloop;
					}
				}
				if (this.knowledge[key].contains(value)) {
					keyValues[key] = { value, item: (slice.link || slice.join) ?
						{ [type]: entity } : entity };
				}
			}

			keyloop:
			for (let key in this._types[type].join) {
				let slice = this._types[type].join[key],
					base = this.entities[entity[slice.join[type]]],
					value = base[slice.order];

				if (typeof value === "undefined") { continue; }

				for (let prop in slice.filters) {
					if (entity[prop] !== slice.filters[prop]) {
						continue keyloop;
					}
				}
				if (this.knowledge[key].contains(value)) {
					keyValues[key] = { value, item: { [type]: entity } };
				}
			}

			// TODO: Implement link types. This is not currently
			// required in HeyNeighbor, so not targeted for first
			// release.
		}

		return keyValues;
	}

	/*
		Adds or updates an entity and updates indexes if necessary.
	*/
	putEntity(entity, excludeKeys) {
		let id = this._id(entity),
			changes = { entities: {}, knowledge: {} },
			oldKeyValues,
			newKeyValues;

		if (this.entities[id]) {
			oldKeyValues = this.getKeyValues(this.entities[id]);
			entity = jsonop(this.entities[id], entity, this._options.entityOp);
		}
		this.entities[id] = changes.entities[id] = entity;
		newKeyValues = this.getKeyValues(entity);

		if (oldKeyValues) {
			for (let key in oldKeyValues) {
				if (oldKeyValues[key].value !== newKeyValues[key].value) {
					this.indexes[key].delete(oldKeyValues[key].value);
					changes.knowledge[key] = changes.knowledge[key] || new RangeArray([]);
					changes.knowledge[key].add([ oldKeyValues[key].value, oldKeyValues[key].value ]);
				} else {
					delete newKeyValues[key];
				}
			}
		}

		if (excludeKeys) { for (let key of excludeKeys) {
			delete newKeyValues[key];
		}}

		for (let key in newKeyValues) {
			this.indexes[key].add(newKeyValues[key].item);
			changes.knowledge[key] = changes.knowledge[key] || new RangeArray([]);
			changes.knowledge[key].add([ newKeyValues[key].value, newKeyValues[key].value ]);
		}

		return entity;
	}

	deleteEntity(id) {
		let keyValues = this.getKeyValues(this.entities[id]),
			changes = { entities: {}, knowledge: {} };
		for (let key in keyValues) {
			if (
				keyValues[key].item === this.entities[id] ||
				keyValues[key].item[keyToSlice(key).type] === this.entities[id]
			) {
				this.indexes[key].delete(keyValues[key].value);
				changes.knowledge[key] = changes.knowledge[key] || new RangeArray([]);
				changes.knowledge[key].add([ keyValues[key].value, keyValues[key].value ]);
			} else {
				for (let type in keyValues[key].item) {
					if (keyValues[key].item[type] === this.entities[id]) {
						// TODO: Decide what to do with compound index entries
						// when one of the referred entities is deleted.

//						this.indexes[key].put({ [type]: null });
					}
				}
			}
		}
		delete this.entities[id];
	}

	putIndex(key, knowledge, items) {
		let slice = keyToSlice(key),
			addType = (comp, type) => {
				this._types[type] = this._types[type] || {
					base: {}, link: {}, join: {}
				};
				this._types[type][comp][key] = slice;
			};
		if (!this.knowledge[key]) {
			addType("base", slice.type);
			if (slice.link) { for (let type in slice.link) {
				addType("link", type);
			}}
			if (slice.join) { for (let type in slice.join) {
				addType("join", type);
			}}

			this.knowledge[key] = knowledge;
			this.indexes[key] = items;
			this.indexEntities(key);
		} else {
			for (let range of knowledge) {
				let rangeItems = items.slice(...range);
				this.indexes[key].splice(...range, rangeItems);
				this.knowledge[key].add(range);
			}
		}
		// insert all the items into entities, updating all indexes
		// except this one.
		if (slice.join || slice.link) {
			for (let item of items) {
				for (let name in item) {
					this.putEntity(item[name], [ key ]);
				}
			}
		} else {
			for (let item of items) {
				this.putEntity(item, [ key ]);
			}
		}

		if (this._queryCallbacks[key]) {
			for (let i in this._queryCallbacks[key]) {
				let { range, callback, watch } = this._queryCallbacks[key][i];
				if (!watch && range.subtract(this.knowledge[key]).length === 0) {
					// No gaps in knowledge; query is satisfied.
					this.query(key, range, callback);
					this.removeQueryCallback(key, i);
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
				this.indexes[key].add(entity);
			}
		}
		/* TODO: Rewrite for perf: use push() then sort() */
	}

	pruneEntities(/* deadline */) {
		/* TODO: Implement in a nonblocking fashion */
	}

	/*
		Make changes to this cache (setState).
	*/
	put(changes) {
		let allChanges = {};

		function mergeChanges(ch) {
			if (ch.entities) jsonop(allChanges.entities, ch.entities);
			jsonop(allChanges.knowledge, ch.knowledge);
		}
		mergeChanges(changes);

		/* handle the addition of ranges of results */
		if (changes.knowledge) {
			if (!changes.indexes) changes.indexes = {};
			for (let key in changes.knowledge) {
				let items = changes.indexes[key];

				if (!(changes.knowledge[key] instanceof RangeArray)) {
					changes.knowledge[key] = new RangeArray(changes.knowledge[key]);
				}
				if (!items) {
					// Todo: generalize for compound indexes:
					// the order (first argument to constructor)
					// should be an array of path segments (["room", "statusTime"])
					// rather than a string.

					// (slice.link || slice.join) ? [slice.type, slice.order] : [slice.order]

					items = new OrderedArray(keyToSlice(key).order, []);
				} else if (!(items instanceof OrderedArray)) {
					changes.indexes[key] = items =
						new OrderedArray(keyToSlice(key).order, changes.indexes[key] || []);
				}

				jsonop(allChanges, this.putIndex(key, changes.knowledge[key], items));
			}
		}

		/* handle the addition of individual entities */
		if (changes.entities) {
			for (let id in changes.entities) {
				if (changes.entities[id] === null) { jsonop(allChanges, this.deleteEntity(id)); }
				else { jsonop(allChanges, this.putEntity(changes.entities[id])); }
			}
		}

		if (changes.app) {
			this.app = jsonop(this.app, changes.app, this._options.appOp);
		}

		/* handle the addition of a query */
		if (changes.queries) {
			for (let key in changes.queries) {
				if (!this.queries[key]) {
					this.queries[key] = changes.queries[key];
				} else {
					for (let range in changes.queries[key]) {
						this.queries[key].add(range);
					}
				}
			}
		}

		/* Trigger query callbacks */
		if (allChanges.knowledge) {
			for (const key in allChanges.knowledge) {
				if (this._queryCallbacks[key]) {
					let removeIndex = [], i = 0;
					this._queryCallbacks[key].forEach(({ range, callback, watch }) => {

						if (new RangeArray([ range ]).intersect(allChanges.knowledge[key]).length) {
							if (watch) {
								callback(this.query(key, range));
							} else {
								if (this.knowledge[key].difference(new RangeArray([ range ])).length === 0) {
									callback(this.query(key, range));
									removeIndex.push(i);
								}
							}
						}
						i++;
					});
				}
			}
		}

		if (allChanges.entities) { for (const id in allChanges.entities) {
			if (this._queryCallbacks.entities[id]) {
				let index = 0, removeIndex = [];

				this._queryCallbacks[id].forEach(({ callback, watch }) => {
					callback(allChanges.entities[id]);
					if (watch) removeIndex.push(index);
					index++;
				});

				removeIndex.forEach(i => {
					this.removeQueryCallback(id, i);
				});
			}
		}}

		/* if there are too many entities, clean up */
		if (Object.keys(this.entities).length > this._options.maxEntities) {
			requestIdleCallback(this.pruneEntities.bind(this));
		}
		this._changeListeners.forEach(fn => fn(allChanges));
	}

	getItemsGaps(key, range) {
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

			if (range.length === 3 && items.length < range[1] + range[2]) {
				let pos = items.indexOf(range[0]);
				if (
					pos < range[1] &&
					!this.knowledge[key].hasStart()
				) { gaps.add([
					items.get(0)[items.order], range[1] - pos, 0
				]); }
				if (
					items.length - pos < range[2] &&
					!this.knowledge[key].hasEnd()
				) { gaps.add([
					items.get(items.length - 1)[items.order], 0,
					range[2] + pos - items.length
				]); }
			}
		}

		/* Insert “loading” placeholders corresponding to the gaps. */
		for (let gap of gaps) {
			if (gap.length === 2) {
				items.put({
					type: "loading", start: gap[0], end: gap[1],
					[items.order]: gap[1] === Infinity ? gap[1] : gap[0]
				});
			} else {
				items.put({
					type: "loading", start: gap[0], before: gap[1], after: gap[2],
					[items.order]: gap[0]
				}, !!items.after);
			}
		}

		/* Update the most recently accessed map */
		if (!this._recentQueries[key]) {
			this._recentQueries[key] = items.getRange();
		} else {
			this._recentQueries[key].put(items.getRange());
		}

		return { items, gaps };
	}

	query (key, range, callback) {
		let { items, gaps } = this.getItemsGaps(key, range);

		/* Make queries corresponding to the gaps. */
		if (gaps.length) {
			this.put({ queries: { [key]: gaps }});
			if (callback) {
				this._queryCallbacks[key] = this._queryCallbacks[key] || [];
				this._queryCallbacks[key].push({ range, callback, watch: false });
			}
		} else {
			if (callback) {
				setImmediate(() => callback(null, items));
			}
		}

		return items;
	}

	watch (key, range, callback) {
		if (!callback) { throw Error("ERR_WATCH_NO_CALLBACK"); }

		let { items } = this.getItemsGaps(key, range, callback, true), index;
		setImmediate(() => callback(null, items));

		this._queryCallbacks[key] = this._queryCallbacks[key] || [];
		index = this._queryCallbacks[key].push({ range, callback, watch: true }) - 1;

		return () => this.removeQueryCallback(key, index);
	}

	removeQueryCallback(key, index) {
		this._queryCallbacks[key].splice(index, 1);
		if (this._queryCallbacks[key].length === 0) {
			delete this._queryCallbacks[key];
		}
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

	getEntity(id, callback) {
		var result;
		this._recentQueries.entities[id] = this._querySeqNum++;
		if (this.entities && this.entities[id]) result = this.entities[id];

		if (result) {
			if (callback) callback(null, result);
			return result;
		} else {
			this.put({
				queries: {
					entities: {
						id: true
					}
				}
			});

			if (callback) {
				this._queryCallback.entities = this._queryCallback.entities || {};
				(this._queryCallback.entities = this._queryCallback.entities || []).push(callback);
			}

			return {type: "loading"};
		}
	}

	with(changes) {
		var cache = new Cache();
		cache.put({ app: jsonop(this.app, changes.app) });
		return cache;
	}
};
