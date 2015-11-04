"use strict";
// let { queryToKeyrange, keyrangeToQuery } = require("./querykeyrange"),
let keyrangeToQuery = require("./querykeyrange").keyrangeToQuery,
	Index = require("./index.js"),
	Range = require("./range.js");

module.exports = class State {
	constructIndex(state) {
		for (let key in state.knowledge) {
			let query = keyrangeToQuery(key, "");
			this.indexes[key] = new Index();
			this.indexes[key].setQuery(query);
		}

		for (let id in this.entities) {
			for (let index in this.indexes) {
				if (this.indexes[index].shouldIndex(this.entities[id])) {
					console.log(this.indexes[index].add(this.entities[id]));
				}
			}
		}
	}

	populateKnowledge() {
		for (let key in this.indexes) {
			let index = this.indexes[key], range;
			console.log(index.length, key);
			range = new Range(index[0][index.getQuery().order], index[0][index.getQuery().order]);
			this.knowledge[key] = [];
			if (!index.length) continue;
			this.knowledge[key].push(range);
		}
	}

	constructor(initialState) {
		this.entities = {};
		this.knowledge = {};
		this.indexes = {};
		for (let i in initialState.entities) {
			if (initialState.entities.hasOwnProperty(i)) {
				this.entities[i] = initialState.entities[i];
			}
		}

		this.constructIndex(initialState);
//		console.log("values",this.indexes[Object.keys(this.indexes)[0]]);
		this.populateKnowledge();
	}
};
