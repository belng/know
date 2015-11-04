"use strict";
let {
	queryToKeyrange, keyrangeToQuery
} = require("./querykeyrange");



module.exports = class Index extends Array {
	constructor(...args) {
		super(...args);
		this.key = "";
		this.query = {};
	}

	setKeyrange(key, range) {
		this.key = key;
		this.range = range;
		this.query = keyrangeToQuery(key, range);
	}
	setQuery(query) {
		let keyRange;
		this.query = query;
		keyRange = queryToKeyrange(query);
		this.key = keyRange.key;
		this.range = keyRange.range;
	}
	getQuery() {
		return this.query;
	}
	getKeyrange() {
		return {
			key: this.key,
			range: this.range
		};
	}

	shouldIndex(entity) {
		let query = this.getQuery(),
			filter;
		if (entity.type !== query.type) return false;
		if (!entity.hasOwnProperty(query.type)) return true;
		for (filter in query.filter) {
			if (entity[filter] !== query.filter[filter]) return false;
		}
		return true;
	}

	findInsertPosition(item) {
		let mid, low = 0, high = this.length - 1, prop = this.query.order, value = item[this.query.order];
		
		if(this.length === 0) return {position: 0, replace: false};
		while (true) {
			mid = Math.floor((low + high) / 2);
			if(low === mid) break;
			if (this[mid][prop] === value) return {position: mid, replace: true};
			else if (this[mid][prop] < value) low = mid;
			else high = mid;
		}
		
		if(this[mid][prop] >= value) return { position : mid, replace: this[mid][prop] === value};
		if(this[high][prop] <= value) return { position : high + (this[high][prop] === value ? 0 : 1), replace: this[high][prop] === value};
		return { position: high, replace: false}
	}
	
	findItemIndex(item) {
		let mid, low = 0, high = this.length - 1, prop = this.query.order, value = item[this.query.order];
		
		if(this.length === 0) return -1;
		while (true) {
			mid = Math.floor((low + high) / 2);
			if(low === mid) break;
			if (this[mid][prop] === value) return {position: mid, replace: true};
			else if (this[mid][prop] < value) low = mid;
			else high = mid;
		}
		
		if(this[mid][prop] >= value) return { position : mid, replace: this[mid][prop] === value};
		if(this[high][prop] <= value) return { position : high + (this[high][prop] === value ? 0 : 1), replace: this[high][prop] === value};
		return { position: high, replace: false}
	}

	get(i) {
		return this[i];
	}
	
	getItems(start, offset) {
		let query = {}, itemIndex;
		query[this.query.order] = start
		itemIndex = findItemIndex(query);
		if()
	}
	
	add(item) {
		var res = this.findInsertPosition(item)
		this.splice(res.position, res.replace? 1 : 0, item);
		return this.length;
	}
};
