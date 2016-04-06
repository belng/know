import { keySlice } from './keyslice';
import OrderedBucket from './ContinuousIndex';
import IndexedBucket from './DiscreteIndex';

class Cache {
	constructor () {
		this.buckets = {};

		this._changeListeners = [];
		this._queryListeners = [];

		this._lastChange = null;
		this._typeMap = {};
	}

	createIndex(descriptor, items) {
		let { key, slice } = keySlice(descriptor);
		this.put({ [key]: new (
			slice.index ? IndexedBucket : OrderedBucket
		)(slice, items) });

		/* Todo: update typeMap */
	}

	getChangeCascade(item) {
		/* Read typeMap and return a changes object */
	}

	get(descriptor, position) {
		const { key } = keySlice(descriptor);
		return this.buckets[key].get(position);
	}

	put(changes, cascade) {
		for (const key in changes) {
			if (!this.buckets[key]) {
				createIndex(key, changes[key]);
			} else {
				this.buckets[key].put(changes[key]);
			}

			if (cascade !== false) {
				const cascadeChanges = {}
				for (const item of changes[key]) {
					cascadeChanges = JsonOp.merge(
						cascadeChanges,
						this.getChangeCascade(item)
					);
				}

				this.put(cascadeChanges, false);
			}

		}


		if (!this._lastChange) {
			this._lastChange = changes;
			setImmediate(this.notifyChanges);
		} else {
			this._lastChange = JsonOp.merge(this._lastChange, changes);
		}
	}

	onChange(fn) {
		this._changeListeners.push(fn);
	}

	onQuery(fn) {
		this._queryListeners.push(fn);
	}

	notifyChanges() {
		this._changeListeners.forEach(fn => fn(this._lastChange));
		this._lastChange = null;
	}
}

export default Store;
