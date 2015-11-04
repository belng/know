"use strict";
// let { queryToKeyrange, keyrangeToQuery } = require("./querykeyrange"),
let keyrangeToQuery = require("./querykeyrange").keyrangeToQuery,
	Index = require("index"),
	Range = require("range");

module.exports = class State {
	constructIndex(state) {
		for (let key in state.knowledge) {
			let query = keyrangeToQuery(key, "");
			this.indexes[key] = new Index();
			this.indexes[key].setQuery(query);
		}

		for (let id in this.entities) {
			for (let index in this.indexes) {
				if (this.indexex[index].shouldIndex(this.entities[id], this.indexex[index])) {
					this.indexex[index].add(this.entities[id]);
				}
			}
		}
	}

	populateKnowledge() {
		for (let key in this.indexes) {
			let index = this.indexes[key], range;
			range = new Range(index[0][index.getQuery().order], index[0][index.getQuery().order]);
			this.knowledge[key] = [];
			if (!index.length) continue;
			this.knowledge[key].push(range);
		}
	}

	constructor(initialState) {
		this.entities = new WeakMap();
		this.knowledge = {};
		this.indexes = {};
		for (let i in initialState.entities) {
			if (initialState.hasOwnProperty(i)) {
				this.entities[i] = initialState.entities[i];
			}
		}
		this.constructIndex(initialState);
		this.populateKnowledge();
	}
};
