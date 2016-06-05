/* eslint-disable no-param-reassign*/

import 'setimmediate';
import jsonop from 'jsonop';
import OrderedArray from './OrderedArray';
import RangeArray from './RangeArray';
import State from './State';
import Change from './Change';
import { keyToSlice, sliceToKey, checkFilters, getDual } from './keyslice';

class Cache {
	constructor(options) {
		const defaults = {
			id: (entity) => { return entity.id; },
			is: (entity, type) => { return entity.type === type; },
			entityOp: {},
			stateOp: {},
			maxEntities: 10000,
			maxQueryAge: 100
		};

		if (options) {
			for (const i in defaults) {
				if (typeof options[i] === 'undefined') {
					options[i] = defaults[i];
				}
			}
		} else { options = defaults; }

		this._id = options.id;
		this._is = options.is;
		this._options = options;

		this.keyToSlice = keyToSlice;
		this.sliceToKey = sliceToKey;
		this.pruneEntities = require('./prune').bind(this);
		this.notifyChanges = this._notifyChanges.bind(this);

		this.clear();
	}

	clear() {
		this._types = {};
		this._changeListeners = [];
		this._queryCallbacks = { entities: {} };
		this._recentQueries = { entities: {} };
		this._querySeqNum = 0;
		this._changes = {};

		this.entities = {};
		this.indexes = {};
		this.queries = { entities: {} };
		this.knowledge = {};

		this.state = new State({});
		this.getState = this.state.get.bind(this.state);
		this.watchState = this.state.watch.bind(this.state);
	}


	/*
		Take a partial compound item (typically with only one component in it)
		and add the other components.
	*/
	fillItem(slice, item) {
		if (!(slice.type in item)) {
			for (const type in item) {
				const entity = item[type];
				if (slice.link && type in slice.link) {
					const { key: dualKey } = getDual(slice, type);
					item[slice.type] = this.getDiscrete(dualKey, entity.id);
					break;
				} else if (slice.join && type in slice.join) {
					item[slice.type] = this.getEntity(entity[slice.join[type]]);
					break;
				} else {
					throw Error('Unexpected ' + type + ' in ' +
						sliceToKey(slice) + ' item');
				}
			}
		}

		if (slice.type in item) {
			const entity = item[slice.type];

			if (slice.link) {
				for (const lType in slice.link) {
					if (lType in item) continue;
					item[lType] = this.getEntity(entity[slice.link[lType]]);
				}
			}
			if (slice.join) {
				for (const jType in slice.join) {
					if (jType in item) continue;
					const { key: dualKey } = getDual(slice, jType);
					item[jType] = this.getDiscrete(
						dualKey, entity.id
					);
				}
			}
			return item;
		} else {
			throw Error('Unable to fill ' + JSON.stringify(item) + ' for ' +
				sliceToKey(slice));
		}
	}

	/*
		Get index keys and corresponding values that must include this entity,
		taking into account knowledge for the same key.
		@param entity
		@returns { key: value }
	*/
	getKeyValues(entity) {
		const keyValues = {};

		if (!entity) return {};

		for (const type in this._types) {
			if (!this._is(entity, type)) { continue; }

			for (const key in this._types[type].base) {
				const slice = this._types[type].base[key],
					item = slice.join || slice.link ?
						this.fillItem(slice, { [type]: entity }) :
						entity,
					value = entity[slice.order];

				if (typeof value === 'undefined') continue;
				if (!checkFilters(item, slice)) continue;

				keyValues[key] = { value, item: entity };

				if (slice.link) {
					for (const linkType in slice.link) {
						const { key: dKey } = getDual(slice, linkType);

						keyValues[dKey] = {
							discrete: true,
							value: entity[slice.link[linkType]],
							item: entity
						};
					}
				}

			}

			for (const key in this._types[type].link) {
				const slice = this._types[type].link[key],
					item = this.fillItem(slice, { [type]: entity }),
					value = item[slice.type][slice.order];

				if (typeof value === 'undefined') continue;
				if (!checkFilters(item, slice)) continue;

				if (this.knowledge[key].contains(value)) {
					keyValues[key] = { value, refreshed: true };
				}
			}

			for (const key in this._types[type].join) {
				const slice = this._types[type].join[key],
					item = this.fillItem(slice, { [type]: entity }),
					value = item[slice.type][slice.order];

				if (typeof value === 'undefined') continue;
				if (!checkFilters(item, slice)) continue;

				if (this.knowledge[key].contains(value)) {
					const { key: dKey } = getDual(slice, type);
					keyValues[key] = { value, refreshed: true };
					keyValues[dKey] = {
						value: entity[slice.join[type]],
						discrete: true,
						item: entity
					};
				}
			}
		}

		return keyValues;
	}

	/*
		Adds or updates an entity and updates indexes if necessary.
	*/
	putEntity(id, entity) {
		const changes = { entities: { [id]: entity }, knowledge: {} };
		let oldKeyValues,
			newKeyValues;

		if (this.entities[id]) {
			oldKeyValues = this.getKeyValues(this.entities[id]);
			entity = jsonop.apply(this.entities[id], entity); // eslint-disable-line
		} else {
			entity = jsonop.apply({}, entity);
		}

		this.entities[id] = entity;
		if (entity) {
			newKeyValues = this.getKeyValues(entity);
		} else {
			newKeyValues = [];
		}

		function addChange(key, value) {
			changes.knowledge[key] = changes.knowledge[key] ||
				new RangeArray([]);
			changes.knowledge[key].add([ value, value ]);
		}

		if (oldKeyValues) {
			for (const key in oldKeyValues) {

				if (oldKeyValues[key].discrete) {
					delete this.indexes[key][oldKeyValues[key].value];
				} else {
					if (!oldKeyValues[key].refreshed) {
						this.indexes[key].delete(oldKeyValues[key].value);
					}
					addChange(key, oldKeyValues[key].value);
				}

			}
		}

		if (newKeyValues) {
			for (const key in newKeyValues) {
				if (newKeyValues[key].discrete) {
					this.indexes[key][newKeyValues[key].value] =
						newKeyValues[key].item;
				} else {
					if (!newKeyValues[key].refreshed) {
						this.indexes[key].add(newKeyValues[key].item);
					}
					addChange(key, newKeyValues[key].value);
				}
			}
		}

		return changes;
	}

	deleteEntity(id) {
		const keyValues = this.getKeyValues(this.entities[id]),
			changes = { entities: { [id]: null }, knowledge: {} };

		for (const key in keyValues) {
			if (
				keyValues[key].item === this.entities[id] ||
				keyValues[key].item[keyToSlice(key).type] === this.entities[id]
			) {
				this.indexes[key].delete(keyValues[key].value);
				changes.knowledge[key] = changes.knowledge[key] || new RangeArray([]);
				changes.knowledge[key].add([ keyValues[key].value, keyValues[key].value ]);
			} else {
				for (const type in keyValues[key].item) {
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
		const slice = keyToSlice(key),
			addType = (comp, type, k, s) => {
				this._types[type] = this._types[type] || {
					base: {}, link: {}, join: {}
				};
				this._types[type][comp][k] = s || keyToSlice(k);
			};
		const changes = new Change();

		if (!this.knowledge[key]) {
			addType('base', slice.type, key, slice);
			if (slice.link) {
				for (const type in slice.link) {
					addType('link', type, key, slice);
				}
			}
			if (slice.join) {
				for (const type in slice.join) {
					addType('join', type, key, slice);
				}
			}

			this.knowledge[key] = knowledge;

			this.indexes[key] = slice.join || slice.link ?
			new OrderedArray([ slice.order ], items.arr.map(item => item[slice.type])) :
			items;

			changes.put(this.indexEntities(key));
		} else {
			for (const range of knowledge) {
				const rangeItems = slice.join || slice.link ?
				new OrderedArray(
					[ slice.order ],
					items.slice(...range).arr.map(item => item[slice.type])
				) :
				items.slice(...range);

				this.indexes[key].splice(...range, rangeItems);
				this.knowledge[key].add(range);
			}
		}

		if (slice.link) {
			for (const type in slice.link) {
				const prop = slice.link[type],
					{ key: dKey } = getDual(slice, type),
					index = this.indexes[dKey] = (this.indexes[dKey] || {});

				items.arr.forEach(item => {
					index[item[slice.type][prop]] = item[slice.type];
				});
			}
		}

		if (slice.join) {
			for (const type in slice.join) {
				const prop = slice.join[type],
					{ key: dKey } = getDual(slice, type),
					index = this.indexes[dKey] = (this.indexes[dKey] || {});

				items.arr.forEach(item => {
					index[item[type][prop]] = item[type];
				});
			}
		}

		// insert all the items into entities, updating all indexes
		// except this one.
		if (slice.join || slice.link) {
			for (const item of items) {
				for (const name in item) {
					if (item[name]) {
						const id = this._id(item[name]);
						changes.put(this.putEntity(id, item[name], [ key ]));
					}
				}
			}
		} else {
			for (const item of items) {
				const id = this._id(item);
				changes.put(this.putEntity(id, item, [ key ]));
			}
		}

		return changes;
	}

	/*
		Checks every entity for inclusion in a particular index. Called when a
		new index is created.
	*/
	indexEntities(key) {
		const slice = keyToSlice(key),
			changes = {};

		for (const id in this.entities) {
			const entity = this.entities[id];
			if (!entity) continue;
			const value = entity[slice.order];
			if (
				typeof value !== 'undefined' &&
				this._is(entity, slice.type) &&
				!slice.join && !slice.link && checkFilters(entity, slice)
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

		const selectedItems = items.slice(...range3),
			range2 = selectedItems.getRange();

		if (selectedItems.length >= range3.before + range3.after) {
			if (range3.before) {
				range2.arr[0].end = range3.start;
			} else if (range3.after) {
				range2.arr[0].start = range3.start;
			}
			return range2;
		}

		if (range3.before === 0) {
			range2.arr[0].start = range3.start;
			range2.arr[0].end = Infinity;
		} else if (range3.after === 0) {
			range2.arr[0].start = -Infinity;
			range2.arr[0].end = range3.start;
		} else {
			const pivot = selectedItems.indexOf(range3.start);
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
		const allChanges = new Change();
		allChanges.put(changes);

		/* handle the addition of ranges of results */
		if (changes.knowledge) {
			if (!changes.indexes) changes.indexes = {};
			for (const key in changes.knowledge) {
				let items = changes.indexes[key];
				const slice = keyToSlice(key);

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
					}
				}

				const ch = this.putIndex(key, changes.knowledge[key], items);
				allChanges.put(ch);
			}
		}

		/* handle the addition of individual entities */
		if (changes.entities) {
			for (const id in changes.entities) {
				if (changes.entities[id] === false) {
					this.putEntity(id, false);
				} else if (changes.entities[id] === null) {
					const ch = this.deleteEntity(id);
					allChanges.put(ch);
				} else {
					const ch = this.putEntity(id, changes.entities[id]);
					allChanges.put(ch);
				}
			}
		}

		if (allChanges.entities) {
			for (const id in allChanges.entities) {
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
			for (const key in changes.queries) {
				if (key === 'entities') {
					for (const id in changes.queries.entities) {
						this.queries.entities[id] = true;
					}
				} else if (!this.queries[key]) {
					this.queries[key] = changes.queries[key];
				} else {
					for (const range of changes.queries[key]) {
						this.queries[key].add(range);
					}
				}
			}
		}

		if (changes['-knowledge']) {
			for (const key in changes['-knowledge']) {
				this.knowledge[key] = this.knowledge[key].difference(changes['-knowledge'][key]);
				allChanges.knowledge = allChanges.knowledge || {};
				allChanges.knowledge[key] = this.knowledge[key];
			}
		}


		/* Trigger query callbacks */
		if (allChanges.knowledge) {
			for (const key in allChanges.knowledge) {
				if (this._queryCallbacks[key]) {
					let i = 0;
					const removeIndex = [];

					this._queryCallbacks[key].forEach(qcb => { // eslint-disable-line no-loop-func

						let range = qcb.range;
						const { callback, watch } = qcb;
						const items = (
							this.indexes[key] && this.indexes[key].length ?
							this.query(key, range) :
							new OrderedArray(this.indexes[key].order, [])
						);

						range = this.countedToBounded(range, this.indexes[key], this.knowledge[key]);

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

		if (allChanges.entities) {
			for (const id in allChanges.entities) {
				if (this._queryCallbacks.entities[id]) {
					let index = 0;
					const removeIndex = [];

					this._queryCallbacks.entities[id].forEach(qcb => { // eslint-disable-line no-loop-func
						const { callback, watch } = qcb;
						const entity = this.entities[id] ? Object.assign({}, this.entities[id]) : this.entities[id];

						if (watch) {
							setImmediate(() => callback(entity));
						} else {
							setImmediate(() => callback(null, entity));
							removeIndex.push(qcb);
						}
						index++;
					});

					removeIndex.reverse().forEach(watch => {
						this.removeEntityCallback(id, watch);
					});
				}
			}
		}


		/* if there are too many entities, clean up */
		if (Object.keys(this.entities).length > this._options.maxEntities) {
			console.info('MAXENTITIES Clearing'); // eslint-disable-line no-console
			this.clear();
			// requestIdleCallback(this.pruneEntities);
		}

		/* fire onChange() */

		const source = allChanges.source ? allChanges.source : '__default__';

		if (this._changes[source]) {
			this._changes[source].put(allChanges);
		} else {
			this._changes[source] = allChanges;
			Promise.resolve().then(this.notifyChanges);
		}
	}

	_notifyChanges() {

		for (const source in this._changes) {
			this._changeListeners.forEach(fn => {
				fn(this._changes[source]);

			});

		}


		this._changes = {};
	}

	getItemsGaps(key, slice, range) {
		let items, gaps;
		const ranges = new RangeArray([ range ]);

		/* Extract items and calculate gaps in knowledge */
		if (!this.knowledge[key]) {
			items = new OrderedArray(this.arrayOrder(slice), []);
			gaps = ranges;
		} else {
			range = RangeArray.makeRange(range);
			items = this.indexes[key].slice(...range);

			if (range.length === 2) {
				gaps = ranges.difference(this.knowledge[key]);
			} else if (items.length === 0) {
				gaps = ranges;
			} else if (items.length < range[1] + range[2]) {
				const pos = items.indexOf(range[0]);

				gaps = items.getRange().difference(this.knowledge[key]);

				if (
					pos < range[1] &&
					!this.knowledge[key].hasStart()
				) {
					gaps.add([
						items.valAt(0), range[1] - pos + 1, 0
					]);
				}

				if (
					items.length - pos < range[2] &&
					!this.knowledge[key].hasEnd()
				) {
					gaps.add([
						items.valAt(items.length - 1), 0,
						range[2] + pos - items.length + 1
					]);
				}
			} else {
				gaps = new RangeArray([]);
			}
		}

		if (slice.link || slice.join) {
			items = new OrderedArray(
				this.arrayOrder(slice),
				items.arr.map(item => {
					const cItem = this.fillItem(slice, { [slice.type]: item });
					for (const type in cItem) {
						if (cItem[type].type === 'loading') gaps.missing = true;
					}

					return cItem;
				})
			);
		}

		function orderObject(object, order, value) {
			let point = object;

			for (let i = 0; i < order.length - 1; i++) {
				const prop = order[i];
				if (!point[prop]) { point[prop] = {}; }
				point = point[prop];
			}
			point[order[order.length - 1]] = value;

			return object;
		}

		/* Insert “loading” placeholders corresponding to the gaps. */
		for (const gap of gaps) {
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
		const key = typeof slice === 'string' ? slice : sliceToKey(slice);

		if (typeof slice === 'string') { slice = keyToSlice(key); }

		if (range.length === 3) {
			if (range[0] === Infinity) { range[2] = 0; }
			if (range[0] === -Infinity) { range[1] = 0; }
		}

		const res = this.getItemsGaps(key, slice, range);
		const items = res.items;
		const gaps = res.gaps;

		/* Make queries corresponding to the gaps. */
		if (gaps.length) {
			this.put({ queries: { [key]: gaps } });
			if (callback) {
				this._queryCallbacks[key] = this._queryCallbacks[key] || [];
				this._queryCallbacks[key].push({
					range, callback, watch: false
				});
			}
		} else if (gaps.missing) {
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
		let key = typeof slice === 'string' ? slice : sliceToKey(slice);
		if (typeof slice === 'string') { slice = keyToSlice(key); }
		const { items, gaps } = this.getItemsGaps(key, slice, range),
			watchObj = { range, callback, watch: true };

		if (typeof slice === 'string') {
			key = slice;
			slice = this.keyToSlice(key); // eslint-disable-line
		} else {
			key = this.sliceToKey(slice);
		}

		setImmediate(() => callback(items));

		if (gaps.length) {
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
		if (!this._queryCallbacks[key]) return;
		const index = this._queryCallbacks[key].indexOf(watch);
		this._queryCallbacks[key].splice(index, 1);
		if (this._queryCallbacks[key].length === 0) {
			delete this._queryCallbacks[key];
		}
	}

	removeEntityCallback(key, watch) {
		if (!this._queryCallbacks.entities[key]) return;
		const index = this._queryCallbacks.entities[key].indexOf(watch);
		this._queryCallbacks.entities[key].splice(index, 1);
		if (this._queryCallbacks.entities[key].length === 0) {
			delete this._queryCallbacks.entities[key];
		}
	}

	onChange(fn) {
		this._changeListeners.push(fn);
	}

	getDiscrete(key, val, callback) {
		let entity = this.indexes[key] && this.indexes[key][val];

		if (entity || entity === null) {
			if (callback) { setImmediate(() => callback(null, entity)); }
		} else {
//			this.put({ queries: { [key]: { [val]: true } } });

			if (callback) {
				this._queryCallbacks[key] = this._queryCallbacks[key] || {};
				this._queryCallbacks[key][val] =
					this._queryCallbacks[key][val] || [];
				this._queryCallbacks[key][val].push({ callback, watch: false });
			}
			entity = { type: 'loading' };
		}

		// this.updateRecentDiscrete(key, val, this.querySeqNum++);
		return entity;
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
