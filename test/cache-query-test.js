"use strict";

/* eslint-env mocha */

var Cache = require("../cache.js"),
	assert = require("assert");
describe("test for query function", function () {
	it("type test", function () {
		var cache = new Cache({
			entities: {
				harish: {
					id: "harish",
					type: "user",
					createTime: 4
				},
				aravind: {
					id: "aravind",
					type: "user",
					createTime: 1
				},
				satya: {
					id: "satya",
					type: "user",
					createTime: 2
				}
			},
			knowledge: {
				"user:createTime": [ {
					start: 1,
					end: 4,
					atStart: true,
					atEnd: true
				} ]
			}
		});
	});
});
