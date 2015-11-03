"use strict";
let { queryToKeyrange, keyrangeToQuery } = require("./querykeyrange"), Index = require("index");

module.exports = class State {
	constructIndex(state) {
		for (key in state.knowledge) {
			let query = keyrangeToquery(key, "");
			this.indexes[key] = new Index();
			this.indexes[key].setQuery(query);
		}

		for (id in this.entities) {
			for (index in this.indexes) {
				if (this.indexex[index].shouldIndex(this.entities[id], this.indexex[index])) {
					this.indexex[index].add(entity);
				}
			}
		}
	}
	
	populateKnowledge() {
		for(key in this.indexes) {
			let index = this.indexes[key];
			this.knowledge[key] = [];
			if(index.length) continue;
			this.knowledge[key].push({
				start: index[0][index.getQuery().order],
				end: index[0][index.getQuery().order]
			});
		}
	}
	
	constructor(initialState) {
		this.entities = new WeakMap();
		this.knowledge = {};
		this.indexes = {};
		for(i in initialState.entities) {
			if(initialState.hasOwnProperty(i)) {
				this.entities[i] = initialState.entities[i]
			}
		}
		constructIndex(initialState);
		populateKnowledge();
	}
};