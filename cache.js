"use strict";
let jsonop = require("jsonop"),
	State = require("state"),
	{queryToKeyrange, keyrangeToQuery} = require("./querykeyrange");

module.exports = class Cache {
	constructor(initialState) {
		this.state = new State(initialState);
		this._objs = [state];
		this.listeners = [];
		this.pending = {};
		this.recent = {};
		
		// Handle situation where called without "new" keyword
	if (false === (this instanceof Store)) {
		throw new Error("Must be initialized before use");
	}

	findValueInIndex(range, ranges) {
		if(range.atStart) range.start = 0;
		if(range.atEnd) return ranges[ranges.length-1].end;
		if(ranges.start <= ranges[0].start) return ranges[0].start;		
		for(i=1;i<ranges.length;i++) if(ranges.start <= ranges[i].start) return ranges[i-1].start;
		return ranges[i-1].start;
	}
	function StartsAtRange(start, ranges) {
		for(i=0;i<ranges.length;i++) {
			if(start<ranges[i].start) return i-1;
			if(start>ranges[i].end) continue;
			return i;
		}
		return -1;
	}
	
	makeQuery() {
	}
	
	query(key, range, callback) {
		let known = this.state.knowledge[key],
			index = this.state.indexes[key];
		let rangeIndex = StartsAtRange(range, known), items = [],
			q = keyrangeToQuery(key, range), item = {};
			item[q.order] = range.start;
		let itemIndex = index.findInsertPosition(item);
		let from, to;
		if(rangeIndex<0) {
			if(isPending(q)) items.push["loading"];
			else items.push["missing"];
			rangeIndex = 0;
		}
		if(q.before) {
			from = itemIndex - q.before;
			to = itemIndex;
		} else {
			from = itemIndex;
			to = itemIndex + q.after;
		}


		for(j = from;i<to && j<index.length;j++) {
			if(known[rangeIndex].end>index[itemIndex][]) {
				let newQ = {};
				newQ.type = q.type;
				newQ.order = q.order;
				newQ.filters = q.filters;
				newQ.range = {
					start: known[rangeIndex].end,
					after: 20
				};
				rangeIndex++;
				if(isPending(newQ)) {
					if (this.getConnectionStatus()==="online") items.push("loading");
					else items.push("missing");
				} else {
					makeQuery(newQ);
				}
			}
			items.push(index[j]);
		}
		
		/*
			TODO:
			If range is entirely contained in one of the items in known,
			extract the values from the index, return them and invoke the
			callback on setImmediate().
			
			Otherwise, return the available data, add queries for the missing
			ranges to this.state.queries via setState() and add the callback
			to this.pending with the queryKey + ":" + range as propname.
			
			In either case, update this.recent
		*/
		
		return items;
	}
	
	setState(c) {
		jsonop(this.state, c);
		if (c.knowledge) {
			/* delete these ranges of pointers from the appropriate indexes */
		}
        
        if (c.entities) {
            /* add these entities to the indexes */
        }
        
		if (c.queries) {
			/* iterate over queries; if any of them is a deletion
				then call query() with it to ensure the callback is
				fired.
			*/
		}
		if (Object.keys(this.state.entities).length > this.opts.maxEntities) {
			/* schedule a cleanup. */
		}
		this.listeners.forEach(fn => fn(c));
	}
	
	onChange(fn) { this.listeners.push(fn); }
	
		get() {
		var args = Array.prototype.slice.call(arguments),
			value, arr;

		for (var i = this._objs.length, l = 0; i > l; i--) {
			arr = args.slice(0);

			arr.unshift(this._objs[i - 1]);

			value = objUtils.get.apply(null, arr);

			if (typeof value !== "undefined") {
				return value;
			}
		}
	}
	with(obj) {
		var objs = this._objs.slice(0);

		objs.push(obj);

		return new Store(objs);
	}
		
	// Convenience methods
	
	getUsers(options, callback) {
		/* todo: from options, calculate key and range */
		query(key, range, callback);
	}
	
};
