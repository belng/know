"use strict";

/* eslint-env mocha */
var queryKeyrange = require("../querykeyrange.js"),
	assert = require("assert");
describe("key range from querytest", function () {
	it("type test", function () {
		var keyRange = queryKeyrange.queryToKeyrange({
			type: "room",
			order: "createTime",
			range: {
				start: 10,
				end: 15
			}
		});
		assert.equal(keyRange.key, "room:createTime", "type or sort order not added correctly");
		assert.equal(keyRange.range, "(+A,+F)", "range not set");
	});

	it("type test", function () {
		var keyRange = queryKeyrange.queryToKeyrange({
			type: "room",
			order: "createTime",
			range: {
				start: 10,
				end: 15
			},
			filter: {
				to: "scrollback"
			}
		});
		assert.equal(keyRange.key, "room:createTime(to:scrollback)", "type or sort order not added correctly");
		assert.equal(keyRange.range, "(+A,+F)", "range not set");
	});
});

describe("query from keyrange test", function () {
	it("type test", function () {
		var query = queryKeyrange.keyrangeToQuery("room:createTime", "(+A,+F)");

		assert.equal(query.type, "room", "query type invalid");
		assert.equal(query.order, "createTime", "query order not correct");
		assert(query.range, "query range not present");
		assert.equal(query.range.start, 10);
		assert.equal(query.range.end, 15);
	});

	it("type test", function () {
		var query = queryKeyrange.keyrangeToQuery("room:createTime(time:+2I+7,to:scrollback)", "(+A,+F)");
		assert.equal(query.type, "room", "query type invalid");
		assert.equal(query.order, "createTime", "query order not correct");
		assert(query.filter, "query filter not present");
		assert.equal(query.filter.time, 1460000000, "filter missing");
		assert.equal(query.filter.to, "scrollback", "filter missing");
		assert(query.range, "query range not present");
		assert.equal(query.range.start, 10);
		assert.equal(query.range.end, 15);
	});
});
