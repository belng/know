import jsonop from 'jsonop';
import OrderedArray from './OrderedArray';
import RangeArray from './RangeArray';
import { keyToSlice, sliceToKey } from './keyslice';

export default class Change {
	constructor(changes) {
		if (changes) this.put(changes);
	}

	arrayOrder(s) {
		return (s.join || s.link) ? [ s.type, s.order ] : [ s.order ];
	}

	put (changes) {
		changes = jsonop({}, changes);

		if (changes.knowledge && Object.keys(changes.knowledge).length) {
			this.knowledge = this.knowledge || {};
			if (changes.indexes && Object.keys(changes.indexes).length) {
				this.indexes = this.indexes || {};
			}

			for (const key in changes.knowledge) {
				const slice = keyToSlice(key);

				if (!this.knowledge[key]) {
					this.knowledge[key] = new RangeArray(changes.knowledge[key]);

					if (changes.indexes && changes.indexes[key]) {
						this.indexes[key] = new OrderedArray(
							this.arrayOrder(slice),
							changes.indexes[key]
						);
					}
				} else {
					for (const range in changes.knowledge) {
						this.knowledge[key].add(range);
						if (changes.indexes && changes.indexes[key]) {
							this.indexes[key].splice(
								...range,
								new OrderedArray(
									this.arrayOrder(slice),
									changes.indexes[key]
								).slice(...range)
							);
						}
					}
				}
			}
		}

		delete changes.knowledge;
		delete changes.indexes;

		jsonop(this, changes);
	}
}
