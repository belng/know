"use strict";


/* eslint-env mocha */

require('babel-register')({sourceMaps: 'inline'});

let RangeArray = require('../lib/RangeArray').default,
	OrderedArray = require('../lib/OrderedArray'),
	Cache = require('../lib/Cache').default,
	assert = require('assert');


it('should handle infinities correctly', () => {
	let cache = new Cache();
	assert.deepEqual(
		cache.countedToBounded(
			RangeArray.makeRange([Infinity, 3, 0]),
			new OrderedArray(["createTime"], [
				{ id: "blahblah1", type: "text", createTime: 21 },
				{ id: "blahblah2", type: "text", createTime: 22 },
				{ id: "blahblah3", type: "text", createTime: 23 },
				{ id: "blahblah4", type: "text", createTime: 24 },
				{ id: "blahblah5", type: "text", createTime: 25 }
			])
		),
		new RangeArray([[23, Infinity]])
	);

});

it('should return infinity for empty', () => {
	let cache = new Cache();
	assert.deepEqual(cache.countedToBounded(
		RangeArray.makeRange([Infinity, 3, 0]),
		new OrderedArray(['asdf'], [])
	), new RangeArray(
		[[-Infinity, Infinity]]
	))
});
