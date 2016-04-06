import Cache from './Cache';
import State from './State';

export default class Store {
	constructor (options) {
		this.cache = new Cache(options);
		this.state = new State(options);

		this._queryCallbacks = { entities: {} };
	}

	query (slice, range, callback) {
		let key = typeof slice === 'string' ? slice : sliceToKey(slice),
			items, gaps, res;

		if (typeof slice === 'string') { slice = keyToSlice(key); }

		res = this.cache.getItemsGaps(key, slice, range);
		items = res.items;
		gaps = res.gaps;

		/* Make queries corresponding to the gaps. */
		if (gaps.length) {
			this.emitChange({ queries: { [key]: gaps } });
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

		return items;
	}

	watch (slice, range, callback) {
		if (!callback) { throw Error('ERR_WATCH_NO_CALLBACK'); }
		if (!range.length && !range.start) {
			throw Error('ERR_INVALID_RANGE');
		}
		let key = typeof slice === 'string' ? slice : sliceToKey(slice),
			{ items, gaps } = this.cache.getItemsGaps(key, slice, range),
			watchObj = { range, callback, watch: true };

			if (typeof slice === 'string') {
				key = slice;
				slice = keyToSlice(key);
			} else {
				key = sliceToKey(slice);
			}

		setImmediate(() => callback(items));

		if (gaps.length) {
			this.emitChange({ queries: { [key]: gaps } });
		}

		this._queryCallbacks[key] = this._queryCallbacks[key] || [];
		this._queryCallbacks[key].push(watchObj);

		this.cache.updateRecent(key, range, Infinity);

		return () => {
			this.cache.updateRecent(key, range, this._querySeqNum++);
			this.removeQueryCallback(key, watchObj);
		};
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
}
