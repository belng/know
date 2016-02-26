'use strict';

require('setimmediate'); // polyfill for env != IE10+
require('./requestIdleCallback');
/* global requestIdleCallback */


let jsonop = require('jsonop'),
	OrderedArray = require('./OrderedArray'),
	RangeArray = require('./RangeArray'),
	State = require('./State'),
	{ keyToSlice, sliceToKey }  = require('./keyslice');

module.exports = class Cache {
	constructor(options) {
		options = jsonop({
			id: (entity) => { return entity.id; },
			is: (entity, type) => { return entity.type === type; },
			entityOp: {},
			stateOp: {},
			maxEntities: 10000,
			maxQueryAge: 100
		}, options || {});

		this.entities = {};
		this.indexes = {};
		this.queries = {
			entities: {}
		};
		this.knowledge = {};
		this.state = new State({ op: options.stateOp });
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
		this._queryCallbacks = {
			entities: {}
		};
		this._recentQueries = { entities: {} };
		this._querySeqNum = 0;
		this._id = options.id;
		this._is = options.is;
		this._options = options;

		this.getState = this.state.get.bind(this.state);
		this.watchState = this.state.watch.bind(this.state);
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

				if (typeof value === 'undefined') { continue; }

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

				if (typeof value === 'undefined') { continue; }

				for (let prop in slice.filters) {
					// TODO: implement operators like _gt, _lt etc.
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

		if (this.queries.entities[entity.id]) {
			let removeCallbacks = [], i = 0;
			this._queryCallbacks.entities[entity.id].forEach(watchObject => {
				if (watchObject.watch) {
					watchObject.callback(entity);
					removeCallbacks.push(watchObject);
				} else {
					watchObject.callback(null, entity);
				}
				i++;
			});

			removeCallbacks.forEach(index => this.removeEntityCallback(entity.id, index));
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
		this.entities[id] = null;
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
			addType('base', slice.type);
			if (slice.link) { for (let type in slice.link) {
				addType('link', type);
			}}
			if (slice.join) { for (let type in slice.join) {
				addType('join', type);
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
			if (typeof value !== 'undefined') {
				this.indexes[key].add(entity);
			}
		}
		/* TODO: Rewrite for perf: use push() then sort() */
	}

	pruneEntities(deadline) {
		/* TODO: Implement in a nonblocking fashion */
		if (!this.pruning) {
			this.pruning = {
				pending: Object.keys(this.indexes),
				entities: {}
			};
		}

		console.info('Start prune pass; Left: ' + this.pruning.pending.length);

		while (this.pruning.pending.length && deadline.timeRemaining() > 0) {
			let key = this.pruning.pending.pop(),
				recent = this._recentQueries[key];
		}

		console.info('End prune pass; left: ' + this.pruning.pending.length);
	}

	/*
		Make changes to this cache (setState).
	*/
	put(changes) {
		let allChanges = jsonop({}, changes);

		/* handle the addition of ranges of results */
		if (changes.knowledge) {
			if (!changes.indexes) changes.indexes = {};
			for (let key in changes.knowledge) {
				let items = changes.indexes[key],
					slice = keyToSlice(key),
					order = [ slice.order ];

				if (slice.join || slice.link) { order.unshift(slice.type); }

				if (!(changes.knowledge[key] instanceof RangeArray)) {
					changes.knowledge[key] = new RangeArray(changes.knowledge[key]);
				}

				if (!items) {
					items = new OrderedArray(order, []);
				} else if (!(items instanceof OrderedArray)) {
					changes.indexes[key] = items =
						new OrderedArray(order, items);
				}

				jsonop(
					allChanges,
					this.putIndex(key, changes.knowledge[key], items)
				);
			}
		}

		/* handle the addition of individual entities */
		if (changes.entities) {
			for (let id in changes.entities) {
				if (changes.entities[id] === null) { jsonop(
					allChanges, this.deleteEntity(id)
				); }
				else { jsonop(
					allChanges, this.putEntity(changes.entities[id])
				); }
			}
		}

		if (changes.state) {
			this.state.put(changes.state);
		}

		/* handle the addition of a query */
		if (changes.queries) {
			for (let key in changes.queries) {
				if (key === 'entities') {
					for (const entity in changes.queries.entities) {
						this.queries.entities[entity] = true;
					}
				} else if (!this.queries[key]) {
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

					this._queryCallbacks[key].forEach(({ // eslint-disable-line no-loop-func
						range, callback, watch
					}) => {
						if (
							new RangeArray([ range ])
							.intersect(allChanges.knowledge[key])
							.length
						) {
							if (watch) {
								callback(this.query(key, range));
							} else if (
								this.knowledge[key]
								.difference(new RangeArray([ range ]))
								.length === 0
							) {
								callback(null, this.query(key, range));
								removeIndex.push(i);
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

				this._queryCallbacks.entities[id].forEach(({ callback, watch }) => { // eslint-disable-line no-loop-func
					if (watch) {
						callback(allChanges.entities[id]);
						removeIndex.push(index);
					} else {
						callback(null, allChanges.entities[id]);
					}
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

	getItemsGaps(key, slice, range) {
		let items, gaps, ranges = new RangeArray([ range ]);

		/* Extract items and calculate gaps in knowledge */
		if (!this.knowledge[key]) {
			let order = slice.order;
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
					type: 'loading', start: gap[0], end: gap[1],
					[items.order]: gap[1] === Infinity ? gap[1] : gap[0]
				});
			} else {
				items.put({
					type: 'loading', start: gap[0], before: gap[1], after: gap[2],
					[items.order]: gap[0]
				}, !!items.after);
			}
		}

		return { items, gaps };
	}

	updateRecent(key, range, num) {
		range.value = num;
		this._recentQueries[key] = this._recentQueries[key] || [];
		this._recentQueries[key].unshift(range);
		this._recentQueries[key].splice(this._options.maxQueryAge);
	}

	query (slice, range, callback) {
		let key = typeof slice === 'string' ? slice : sliceToKey(slice),
			{ items, gaps } = this.getItemsGaps(key, slice, range);

		if (typeof slice === 'string') { slice = keyToSlice(key); }

		/* Make queries corresponding to the gaps. */
		if (gaps.length) {
			this.put({ queries: { [key]: gaps }});
			if (callback) {
				this._queryCallbacks[key] = this._queryCallbacks[key] || [];
				this._queryCallbacks[key].push({
					range, callback, watch: false
				});
			}
		} else {
			if (callback) {
				setImmediate(() => callback(null, items));
			}
		}

		this.updateRecent(key, range, this._querySeqNum++);

		return items;
	}

	watch (slice, range, callback) {
		if (!callback) { throw Error('ERR_WATCH_NO_CALLBACK'); }

		let key = this.sliceToKey(slice),
			{ items } = this.getItemsGaps(key, slice, range, callback, true),
			watchObj = { range, callback, watch: true };

		setImmediate(() => callback(null, items));

		this._queryCallbacks[key] = this._queryCallbacks[key] || [];
		this._queryCallbacks[key].push(watchObj);

		this.updateRecent(key, range, Infinity);

		return () => {
			this.updateRecent(key, range, this._querySeqNum++);
			this.removeQueryCallback(key, watchObj);
		};
	}

	removeQueryCallback(key, watch) {
		const index = this._queryCallbacks[key].indexOf(watch);
		this._queryCallbacks[key].splice(index, 1);
		if (this._queryCallbacks[key].length === 0) {
			delete this._queryCallbacks[key];
		}
	}

	removeEntityCallback(key, watch) {
		const index = this._queryCallbacks.entities[key].indexOf(watch);
		this._queryCallbacks.entities[key].splice(index, 1);
		if (this._queryCallbacks.entities[key].length === 0) {
			delete this._queryCallbacks.entities[key];
		}
	}

	onChange(fn) {
		this._changeListeners.push(fn);
	}

	getEntity(id, callback) {
		const entity = this.entities && this.entities[id];

		if (entity || entity === null) {
			if (callback) { setTimeout(() => callback(entity)); }
			return entity;
		} else {
			this.put({ queries: { entities: { [id]: true } } });
			if (callback) {
				this._queryCallbacks.entities = this._queryCallbacks.entities || {};
				(this._queryCallbacks.entities[id] = this._queryCallbacks.entities[id] || []).push({ callback, watch: false});
			}

			return { type: 'loading' };
		}
	}

	watchEntity(id, callback) {
		const entity = this.entities && this.entities[id],
			watch = { callback, watch: true };

		if (!callback) { throw Error('ERR_WATCH_NO_CALLBACK'); }

		if (entity || entity === null) {
			setTimeout(() => callback(entity));
		} else {
			setTimeout(() => callback({ type: 'loading' }));
		}

		this._queryCallbacks.entities = this._queryCallbacks.entities || {};
		this._queryCallbacks.entities[id] = this._queryCallbacks.entities[id] || [];
		this._queryCallbacks.entities[id].push(watch);

		return () => this.removeEntityCallback(id, watch);
	}
};
