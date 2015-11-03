"use strict";
let { queryToKeyrange, keyrangeToQuery } = require("./querykeyrange"), Index = require("index");

module.exports = class State {
	constructIndex(state) {
		for (key in this.knowledge) {
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

	constructor(initialState) {
		this.entities = new WeakMap();
		this.knowledge = {};
		this.indexes = {};
		constructIndex(initialState);
	}
};