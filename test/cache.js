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

it("should insert a new range", function () {
	cache.put({
		knowledge: { "room:updateTime(:)": [ [ 0, 7 ] ] },
		indexes: { "room:updateTime(:)": [
			{ id: "numix", updateTime: 1 },
			{ id: "scrollback", updateTime: 3 },
			{ id: "bangalore", updateTime: 6 }
		] }
	});

	let res = cache.query("room:updateTime(:)", [1, 9]);

	console.log(JSON.stringify(res));
});

/*
	TODO:
	Existing entities should be indexed when adding knowledge.
	Queries should return loading placeholders
	Queries should be added to cache.queries
	Cache._recentQueries should be updated

*/
