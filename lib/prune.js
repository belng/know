module.exports = function (deadline) {
	if (!this.pruning) {
		this.pruning = {
			pending: Object.keys(this.indexes),
			entities: {}
		};
		this._recentQueries = { entities: {} };
	}

	function keepEntity(entity) {
		this.pruning.entities[this._id(entity)] = entity;
	}

	console.info('Start prune pass; left: ' + this.pruning.pending.length);

	while (this.pruning.pending.length && deadline.timeRemaining() > 0) {
		let key = this.pruning.pending.pop(),
			recent = this._recentQueries[key],
			knowledge = new RangeArray([]),
			items = [],
			slice;

		if (key === 'entities') { continue; }

		slice = keyToSlice(key);

		for (let range of recent) {
			if (
				range.value > this._querySeqNum - this._options.maxQueryAge
			) {
				knowledge.add(range);
			}
		}
		knowledge = this.knowledge[key].intersect(knowledge);

		for (let range of knowledge) {
			items = items.concat(this.indexes[key].slice(...range));
		}

		for (let item of items) {
			if (slice.join) { for (let type in slice.join) {
				keepEntity(item[type]);
			} }

			if (slice.link) { for (let type in slice.link) {
				keepEntity(item[type]);
			} }

			if (slice.join || slice.link) {
				keepEntity(item[slice.type]);
			} else {
				keepEntity(item);
			}
		}

		this.indexes[key] = new OrderedArray(
			this.arrayOrder(slice), items
		);
		this.knowledge[key] = knowledge;
	}

	console.info('End prune pass; left: ' + this.pruning.pending.length);

	if (this.pruning.pending.length === 0) {

		// TODO:
		// 1. Add logic to keep recently accessed entities.
		// 2. Restore cross-indexes.
		// 3. Adjust the maxEntities and maxQueryAge properties.

		// for (let entity in this._recentQueries.entities) {
		// 	if (
		// 		range.value > this._querySeqNum - this._options.maxQueryAge
		// 	) {
		// 		this.pruning.entities[id] = this.entities[id];
		// 	}
		// }


		this.entities = this.pruning.entities;
		delete this.pruning;
		console.log("Prune complete; left: " + this.entities.length);
	} else {
		requestIdleCallback(this.pruneEntities);
	}
}
