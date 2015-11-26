/* eslint-env mocha */
/* eslint no-console:0 */

let Cache = require("../lib/Cache"),
	assert = require("assert"),
	cache;

beforeEach(() => {
	cache = new Cache();
});

it("should insert a single entity", function () {
	let room = {
		id: "numix",
		type: "room",
		description: "GTK+ and Gnome Shell themes."
	};
	cache.put({ entities: { numix: room }});
	assert.deepEqual(cache.entities, { numix: room });
});

it("should insert a new range and query it", function () {
	cache.put({
		knowledge: { "room:updateTime(:)": [ [ 0, 7 ] ] },
		indexes: { "room:updateTime(:)": [
			{ id: "numix", updateTime: 1 },
			{ id: "scrollback", updateTime: 3 },
			{ id: "bangalore", updateTime: 6 }
		] }
	});

	let res = cache.query("room:updateTime(:)", [ 1, 5 ]);
	assert.equal(res.arr.length, 2, "incorrect results");
	assert.equal(res.arr[0].updateTime, 1, "incorrect item");
	assert.equal(res.arr[1].updateTime, 3, "incorrect item");

	res = cache.query("room:updateTime(:)", [ 1, 9 ]);
	assert.equal(res.arr.length, 4, "incorrect results");
	assert.equal(res.arr[0].updateTime, 1, "incorrect item");
	assert.equal(res.arr[1].updateTime, 3, "incorrect item");
	assert.equal(res.arr[2].updateTime, 6, "incorrect item");
	assert.equal(res.arr[3].updateTime, 7, "incorrect item");
	assert.equal(res.arr[3].type, "loading", "incorrect item");

	res = cache.query("room:updateTime(:)", [ 3, 0, 1 ]);
	assert.equal(res.arr.length, 1, "incorrect results");
	assert.equal(res.arr[0].updateTime, 3, "incorrect item");

	res = cache.query("room:updateTime(:)", [ 1, 0, 3 ]);
	assert.equal(res.arr.length, 3, "incorrect results");
	assert.equal(res.arr[0].updateTime, 1, "incorrect item");
	assert.equal(res.arr[1].updateTime, 3, "incorrect item");
	assert.equal(res.arr[2].updateTime, 6, "incorrect item");
});

it.only("should insert and query a new range which has most recent data", function () {
	cache.put({
		knowledge: { "relation:roleTime(:)": [ [ 0, +Infinity ] ] },
		indexes: { "relation:roleTime(:)": [
			{ id: "harish_numix", roleTime: 1 },
			{ id: "satya_numix", roleTime: 3 },
			{ id: "aravind_numix", roleTime: 6 }
		] }
	});

	console.log(cache.knowledge);
	let res = cache.query("relation:roleTime(:)", [ 1, 9 ]);
	console.log("all items reading: done", res);
	assert.equal(res.arr[0].roleTime, 1, "incorrect item");
	assert.equal(res.arr[1].roleTime, 3, "incorrect item");
	assert.equal(res.arr[2].roleTime, 6, "incorrect item");

	res = cache.query("relation:roleTime(:)", [ 3, 0, 3 ]);
	assert.equal(res.arr.length, 2, "incorrect results");
	assert.equal(res.arr[0].roleTime, 3, "incorrect item");
	assert.equal(res.arr[1].roleTime, 6, "incorrect item");

	res = cache.query("relation:roleTime(:)", [ 3, 2, 3 ]);
	assert.equal(res.arr.length, 4, "incorrect results");
	assert.equal(res.arr[0].type, "loading", "incorrect item");
	assert.equal(res.arr[1].roleTime, 1, "incorrect item");
	assert.equal(res.arr[2].roleTime, 3, "incorrect item");
	assert.equal(res.arr[3].roleTime, 6, "incorrect item");
	assert(Object.keys(cache.queries), "no queries added");
});


it("should index entities when adding knowledge: ", function () {
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
	console.log(JSON.stringify(cache.indexes));
});

it.only("deleting an item which is part of an index: ", function () {
	cache.put({
		knowledge: { "room:updateTime(:)": [ [ 0, 7 ] ] },
		indexes: { "room:updateTime(:)": [
			{ id: "numix", updateTime: 1 },
			{ id: "scrollback", updateTime: 3 },
			{ id: "bangalore", updateTime: 6 }
		] }
	});

	cache.put({
		numix: null
	});
	let res = cache.query("room:updateTime(:)", [ 1, 5 ]);
	console.log(res);
	assert.equal(res.arr[0].id, "numix", "didnt delete");
});

/*
	TODO:
	Existing entities should be indexed when adding knowledge.
	Queries should return loading placeholders
	Queries should be added to cache.queries
	Cache._recentQueries should be updated
*/
