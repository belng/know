import 'setimmediate'; // polyfill for env != IE10+
import './requestIdleCallback';
import jsonop from 'jsonop';
import OrderedArray from './OrderedArray';
import RangeArray from './RangeArray';
import State from './State';
import { keyToSlice, sliceToKey }  from './keyslice';
/* global requestIdleCallback */

class Cache {
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

		this.pruneEntities = require('./prune').bind(this);
	}

	/*
		Get index keys and corresponding values that must include this entity,
		taking into account knowledge for the same key.
		@param entity
		@returns { key: value }
	*/
	getKeyValues(entity) {
		let keyValues = {};

		if (entity === false) return {};
		console.log("TYPES:",this._types);
		for (let type in this._types) {
			if (!this._is(entity, type)) { continue; }

			keyloop:
			for (let key in this._types[type].base) {
				let slice = this._types[type].base[key],
					value = entity[slice.order];

				if (typeof value === 'undefined') { continue; }
				if (slice.join || slice.link) { continue; }

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

			// keyloop:
			// for (let key in this._types[type].join) {
			// 	let slice = this._types[type].join[key],
			// 		base = this.entities[entity[slice.join[type]]],
			// 		value = base[slice.order];
			//
			// 	if (typeof value === 'undefined') { continue; }
			//
			// 	for (let prop in slice.filters) {
			// 		// TODO: implement operators like _gt, _lt etc.
			// 		if (entity[prop] !== slice.filters[prop]) {
			// 			continue keyloop;
			// 		}
			// 	}
			// 	if (this.knowledge[key].contains(value)) {
			// 		keyValues[key] = { value, item: { [type]: entity } };
			// 	}
			// }

			// TODO: Implement link types. This is not currently
			// required in HeyNeighbor, so not targeted for first
			// release.
		}

		return keyValues;
	}

	/*
		Adds or updates an entity and updates indexes if necessary.
	*/
	putEntity(id, entity, excludeKeys) {
		let changes = { entities: { [id]: entity }, knowledge: {} },
			oldKeyValues,
			newKeyValues;

		if (this.entities[id] === false) {
			oldKeyValues = [];
		} else if (this.entities[id]) {
			oldKeyValues = this.getKeyValues(this.entities[id]);
			entity = jsonop(this.entities[id], entity, this._options.entityOp);
		}

		this.entities[id] = changes.entities[id] = entity;
		newKeyValues = this.getKeyValues(entity);

		console.log("new keys", newKeyValues);
		if (oldKeyValues) {
			for (let key in oldKeyValues) {
				if (newKeyValues[key]) {
					if (oldKeyValues[key].value !== newKeyValues[key].value) {
						this.indexes[key].delete(oldKeyValues[key].value);
						changes.knowledge[key] = changes.knowledge[key] || new RangeArray([]);
						changes.knowledge[key].add([ oldKeyValues[key].value, oldKeyValues[key].value ]);
					} else {
						delete newKeyValues[key];
					}
				}
			}
		}

		if (excludeKeys) {
			for (let key of excludeKeys) {
				delete newKeyValues[key];
			}
		}

		for (let key in newKeyValues) {
			this.indexes[key].add(newKeyValues[key].item);
			changes.knowledge[key] = changes.knowledge[key] || new RangeArray([]);
			changes.knowledge[key].add([ newKeyValues[key].value, newKeyValues[key].value ]);
		}

		return changes;
	}

	deleteEntity(id) {
		let keyValues = this.getKeyValues(this.entities[id]),
			changes = { entities: { [id]: null }, knowledge: {} };

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

		return changes;
	}

	putIndex(key, knowledge, items) {
		let slice = keyToSlice(key),
			changes = {},
			addType = (comp, type) => {
				this._types[type] = this._types[type] || {
					base: {}, link: {}, join: {}
				};
				this._types[type][comp][key] = slice;
			};

		if (!this.knowledge[key]) {
			addType('base', slice.type);
			if (slice.link) {
				for (let type in slice.link) {
					addType('link', type);
				}
			}
			if (slice.join) {
				for (let type in slice.join) {
					addType('join', type);
				}
			}

			this.knowledge[key] = knowledge;
			this.indexes[key] = items;

			jsonop(changes, this.indexEntities(key));
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
					const id = this._id(item[name]);
					jsonop(changes, this.putEntity(id, item[name], [ key ]));
				}
			}
		} else {
			for (let item of items) {
				const id = this._id(item);
				jsonop(changes, this.putEntity(id, item, [ key ]));
			}
		}

		return changes;
	}

	/*
		Checks every entity for inclusion in a particular index. Called when a
		new index is created.
	*/
	indexEntities(key) {
		let slice = keyToSlice(key),
			changes = {};
		for (let id in this.entities) {
			let entity, value;
			entity = this.entities[id];
			if (!entity) continue;
			value = entity[slice.order];
			if (
				typeof value !== 'undefined' &&
				this._is(entity, slice.type) &&
				!slice.join && !slice.link
			) {
				this.indexes[key].add(entity);
				changes.knowledge = changes.knowledge || {};
				changes.knowledge[key] = changes.knowledge[key] || new RangeArray([]);
				changes.knowledge[key].add([ value, value ]);
			}
		}

		return changes;
		/* TODO: Rewrite for perf: use push() then sort() */
	}

	arrayOrder(s) {
		return (s.join || s.link) ? [ s.type, s.order ] : [ s.order ];
	}

	countedToBounded(range3, items) {
		if (range3.length === 2) {
			return new RangeArray([ range3 ]);
		}

		let selectedItems = items.slice(...range3),
			range2 = selectedItems.getRange();

		if (selectedItems.length >= range3.before + range3.after) return range2;

		if (range3.before === 0) {
			range2.arr[0].start = -Infinity;
		} else if (range3.after === 0) {
			range2.arr[0].end = Infinity;
		} else {
			let pivot = selectedItems.indexOf(range3.start);
			range2.arr[0].start = pivot < range3.before ? -Infinity : selectedItems.valAt(0);
			range2.arr[0].end = selectedItems.length - pivot < range3.end ? +Infinity :
				selectedItems.valAt(selectedItems.length - 1);
		}
		return range2;
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
					slice = keyToSlice(key);

				if (!(changes.knowledge[key] instanceof RangeArray)) {
					changes.knowledge[key] = new RangeArray(changes.knowledge[key]);
				}

				if (!items) {
					items = new OrderedArray(this.arrayOrder(slice), []);
				} else if (!(items instanceof OrderedArray)) {
					changes.indexes[key] = items =
						new OrderedArray(this.arrayOrder(slice), items);
				}

				if (this.queries[key]) {
					this.queries[key] = this.queries[key]
						.difference(changes.knowledge[key]);

					if (this.queries[key].length === 0) {
						delete this.queries[key];
						// allChanges.queries = allChanges.queries || {};
						// allChanges.queries.__op__ = allChanges.queries.__op__ || {};
						// allChanges.queries.__op__[key] = 'delete';
					}
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
				if (changes.entities[id] === false) {
					this.putEntity(id, false);
				} else if (changes.entities[id] === null) { jsonop(
					allChanges, this.deleteEntity(id)
				); } else { jsonop(
					allChanges, this.putEntity(id, changes.entities[id])
				); }

				if (id in this.queries.entities) {
					delete this.queries.entities[id];
				}
			}

		}

		if (changes.state) {
			this.state.put(changes.state);
		}

		/* handle the addition of a query */
		if (changes.queries) {
			for (let key in changes.queries) {
				if (key === 'entities') {
					for (const id in changes.queries.entities) {
						this.queries.entities[id] = true;
					}
				} else if (!this.queries[key]) {
					this.queries[key] = changes.queries[key];
				} else {
					for (let range of changes.queries[key]) {
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

					this._queryCallbacks[key].forEach(qcb => { // eslint-disable-line no-loop-func

						let { range, callback, watch } = qcb;
						const items = this.indexes[key].slice(...RangeArray.makeRange(range));

						range = this.countedToBounded(range, this.indexes[key], this.knowledge[key]);

						console.log("Current range: ", range);
						console.log("New knowledge", range);
						console.log("Intersect: ", range.intersect(allChanges.knowledge[key]));
						if (
							range.intersect(allChanges.knowledge[key])
							.length
						) {
							if (watch) {
								callback(items);
							} else if (
								range.difference(this.knowledge[key])
								.length === 0
							) {
								callback(null, items);
								removeIndex.push(qcb);
							}
						}
						i++;
					});

					removeIndex.reverse().forEach(watch => {
						this.removeQueryCallback(key, watch);
					});
				}
			}
		}

		if (allChanges.entities) { for (const id in allChanges.entities) {
			if (this._queryCallbacks.entities[id]) {
				let index = 0, removeIndex = [];

				this._queryCallbacks.entities[id].forEach(qcb => { // eslint-disable-line no-loop-func
					let { callback, watch } = qcb;
					if (watch) {
						setImmediate(() => callback(allChanges.entities[id]));
					} else {
						setImmediate(() => callback(null, allChanges.entities[id]));
						removeIndex.push(qcb);
					}
					index++;
				});

				removeIndex.reverse().forEach(watch => {
					this.removeEntityCallback(id, watch);
				});
			}
		} }

		/* if there are too many entities, clean up */
		if (Object.keys(this.entities).length > this._options.maxEntities) {
			requestIdleCallback(this.pruneEntities);
		}
		this._changeListeners.forEach(fn =>
			setImmediate(() => fn(allChanges))
		);
	}

	getItemsGaps(key, slice, range) {
		let items, gaps, ranges = new RangeArray([ range ]);

		/* Extract items and calculate gaps in knowledge */
		if (!this.knowledge[key]) {
			items = new OrderedArray(this.arrayOrder(slice), []);
			gaps = ranges;
		} else {
			range = RangeArray.makeRange(range);
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
					items.valAt(0), range[1] - pos, 0
				]); }
				if (
					items.length - pos < range[2] &&
					!this.knowledge[key].hasEnd()
				) { gaps.add([
					items.valAt(items.length - 1), 0,
					range[2] + pos - items.length
				]); }
			}
		}

		function orderObject(object, order, value) {
			let point = object;

			for (let i = 0; i < order.length - 1; i++) {
				let prop = order[i];
				if (!point[prop]) { point[prop] = {}; }
				point = point[prop];
			}
			point[order[order.length - 1]] = value;

			return object;
		}

		/* Insert “loading” placeholders corresponding to the gaps. */
		for (let gap of gaps) {
			if (gap.length === 2) {
				items.put(orderObject(
					{ type: 'loading', start: gap[0], end: gap[1] },
					items.order, gap[1] === Infinity ? gap[1] : gap[0]
				));
			} else {
				items.put(orderObject(
					{ type: 'loading', start: gap[0],
					  before: gap[1], after: gap[2] },
					items.order, gap[0]
				), !!items.after);
			}
		}

		return { items, gaps };
	}

	updateRecent(key, range, num) {
		range = [ ...range ];
		range.value = num;
		this._recentQueries[key] = this._recentQueries[key] || [];
		this._recentQueries[key].unshift(range);
		this._recentQueries[key].splice(this._options.maxQueryAge);
	}

	updateRecentEntity(id, num) {
		this._recentQueries.entities[id] = num;
	}

	query (slice, range, callback) {
		let key = typeof slice === 'string' ? slice : sliceToKey(slice),
			items, gaps, res;

		if (typeof slice === 'string') { slice = keyToSlice(key); }

		if (range.length === 3) {
			if (range[0] === Infinity) { range[2] = 0; }
			if (range[0] === -Infinity) { range[1] = 0; }
		}

		res = this.getItemsGaps(key, slice, range);
		items = res.items;
		gaps = res.gaps;

		/* Make queries corresponding to the gaps. */
		if (gaps.length) {
			this.put({ queries: { [key]: gaps } });
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
		if (!range.length && !range.start) {
			throw Error('ERR_INVALID_RANGE');
		}
		let key = typeof slice === 'string' ? slice : sliceToKey(slice),
			{ items, gaps } = this.getItemsGaps(key, slice, range),
			watchObj = { range, callback, watch: true };

			if (typeof slice === 'string') {
				key = slice;
				slice = this.keyToSlice(key);
			} else {
				key = this.sliceToKey(slice);
			}

		setImmediate(() => callback(items));

		if (gaps.length) {
			console.log('Emitting queries: ', { queries: { [key]: gaps } });
			this.put({ queries: { [key]: gaps } });
		}

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
		let entity = this.entities && this.entities[id];

		if (entity || entity === null) {
			if (callback) { setImmediate(() => callback(null, entity)); }
		} else {
			this.put({ queries: { entities: { [id]: true } } });
			if (callback) {
				(this._queryCallbacks.entities[id] =
					this._queryCallbacks.entities[id] || [])
				.push({ callback, watch: false });
			}
			entity = { type: 'loading' };
		}

		this.updateRecentEntity(id, this.querySeqNum++);
		return entity;
	}

	watchEntity(id, callback) {
		const entity = this.entities && this.entities[id],
			watch = { callback, watch: true };

		if (!callback) { throw Error('ERR_WATCH_NO_CALLBACK'); }

		if (entity || entity === null) {
			setImmediate(() => callback(entity));
		} else {
			this.put({ queries: { entities: { [id]: true } } });
			setImmediate(() => callback({ type: 'loading' }));
		}

		this._queryCallbacks.entities = this._queryCallbacks.entities || {};
		this._queryCallbacks.entities[id] = this._queryCallbacks.entities[id] || [];
		this._queryCallbacks.entities[id].push(watch);

		this.updateRecentEntity(id, Infinity);

		return () => {
			this.updateRecentEntity(id, this.querySeqNum++);
			this.removeEntityCallback(id, watch);
		};
	}
}

Cache.RangeArray = RangeArray;
Cache.OrderedArray = OrderedArray;

export default Cache;
