"use strict";
let { queryToKeyrange, keyrangeToQuery } = require("./querykeyrange"),
	Index = require("index"),
	Range = require("range");

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
			let index = this.indexes[key], range;
			range = new Range(index[0][index.getQuery().order,index[0][index.getQuery().order);
			this.knowledge[key] = [];
			if(!index.length) continue;
			this.knowledge[key].push(range);
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