/* eslint-env mocha */
/* eslint no-console:0 */

let Cache = require("../lib/Cache"),
	assert = require("assert"),
	cache;

describe("should insert a single entity", function () {
	let cache = new Cache();
	let room = {
		id: "numix",
		type: "room",
		description: "GTK+ and Gnome Shell themes."
	};
	cache.put({ entities: { numix: room }});
	it("checking if the insert was successful", function(){
		assert.deepEqual(cache.entities, { numix: room });
	});
});

describe("should insert a new range and query it", function () {
	let cache = new Cache();
	cache.put({
		knowledge: { "room:updateTime(:)": [ [ 0, 7 ] ] },
		indexes: { "room:updateTime(:)": [
			{ id: "numix", updateTime: 1 },
			{ id: "scrollback", updateTime: 3 },
			{ id: "bangalore", updateTime: 6 }
		] }
	});

	it("simple query", function() {
		let res = cache.query("room:updateTime(:)", [ 1, 5 ]);
		assert.equal(res.arr.length, 2, "incorrect results");
		assert.equal(res.arr[0].updateTime, 1, "incorrect item");
		assert.equal(res.arr[1].updateTime, 3, "incorrect item");
	});

	it("query with loading at the end", function() {
		let res = cache.query("room:updateTime(:)", [ 1, 9 ]);
		assert.equal(res.arr.length, 4, "incorrect results");
		assert.equal(res.arr[0].updateTime, 1, "incorrect item");
		assert.equal(res.arr[1].updateTime, 3, "incorrect item");
		assert.equal(res.arr[2].updateTime, 6, "incorrect item");
		assert.equal(res.arr[3].updateTime, 7, "incorrect item");
		assert.equal(res.arr[3].type, "loading", "incorrect item");
	});

	it("query with 3 property ranges with after only single item", function() {
		let res = cache.query("room:updateTime(:)", [ 3, 0, 1 ]);
		assert.equal(res.arr.length, 1, "incorrect results");
		assert.equal(res.arr[0].updateTime, 3, "incorrect item");
	});

	it("query with 3 property ranges with after only: multiple items with no loading", function() {
		let res = cache.query("room:updateTime(:)", [ 1, 0, 3 ]);
		assert.equal(res.arr.length, 3, "incorrect results");
		assert.equal(res.arr[0].updateTime, 1, "incorrect item");
		assert.equal(res.arr[1].updateTime, 3, "incorrect item");
		assert.equal(res.arr[2].updateTime, 6, "incorrect item");
	});
});

describe("query for cache with infinity in the end", function() {
	let cache = new Cache({
		is: (entity, type) => { return type === "relation"; }
	});
	cache.put({
		knowledge: { "relation:roleTime(:)": [ [ 0, +Infinity ] ] },
		indexes: { "relation:roleTime(:)": [
			{ id: "harish_numix", roleTime: 1 },
			{ id: "satya_numix", roleTime: 3 },
			{ id: "aravind_numix", roleTime: 6 }
		] }
	});

	it("query with 2 prop ranges", function () {
		let res = cache.query("relation:roleTime(:)", [ 1, 9 ]);
		assert.equal(res.arr[0].roleTime, 1, "incorrect item");
		assert.equal(res.arr[1].roleTime, 3, "incorrect item");
		assert.equal(res.arr[2].roleTime, 6, "incorrect item");
	});

	it("query with 3 prop ranges: shouldn't return loading at the end.", function () {
		let res = cache.query("relation:roleTime(:)", [ 3, 0, 3 ]);
		assert.equal(res.arr.length, 2, "incorrect results");
		assert.equal(res.arr[0].roleTime, 3, "incorrect item");
		assert.equal(res.arr[1].roleTime, 6, "incorrect item");
	});
	it("query with 3 prop ranges: should give loading in the beginning and add a query.", function () {
		let res = cache.query("relation:roleTime(:)", [ 3, 2, 3 ]);
		console.log(res);
		assert.equal(res.arr.length, 4, "length not correct on ");
		assert.equal(res.arr[0].type, "loading", "incorrect item");
		assert.equal(res.arr[1].roleTime, 1, "incorrect item");
		assert.equal(res.arr[2].roleTime, 3, "incorrect item");
		assert.equal(res.arr[3].roleTime, 6, "incorrect item");
		assert(Object.keys(cache.queries), "no queries added");
	});
});


describe("should index entities when adding knowledge: ", function () {
	let cache = new Cache({
		is: (entity, type) => { return type === "relation"; }
	});
	cache.put({
		entities: {
			harish_numix: { id: "harish_numix", roleTime: 1 },
			aravind_numix: { id: "aravind_numix", roleTime: 3 },
			satya_numix: { id: "satya_numix", roleTime: 6 }
		}
	});
	cache.put({
		knowledge: { "relation:roleTime(:)": [ [ 0, +Infinity ] ] }
	});
	it("adding knowledge should add the indexes", function() {
		console.log(cache.indexes);
		assert(Object.keys(cache.indexes).length, "no index added");
	});
});

describe("deleting an item which is part of an index: ", function () {
	let cache = new Cache();
	cache.put({
		knowledge: { "room:updateTime(:)": [ [ 0, 7 ] ] },
		indexes: { "room:updateTime(:)": [
			{ id: "numix", type: "room", updateTime: 1 },
			{ id: "scrollback", type: "room", updateTime: 3 },
			{ id: "bangalore", type: "room", updateTime: 6 }
		] }
	});

	cache.put({
		entities: {
			numix: null
		}
	});
	
	it("item should be deleted", function() {
		let res = cache.query("room:updateTime(:)", [ 1, 9 ]);
		console.log(res, cache.entities);
		assert(res.arr[0].id !== "numix", "didnt delete");
	});
});

/*
	TODO:
	Existing entities should be indexed when adding knowledge.
	Queries should return loading placeholders
	Queries should be added to cache.queries
	Cache._recentQueries should be updated
*/
