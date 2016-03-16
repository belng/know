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
			RangeArray.makeRange([Infinity, 20, 0]),
			new OrderedArray(["createTime"], [
				{ id: "blahblah", type: "text", createTime: 25 }
			])
		),
		new RangeArray([[25, Infinity]])
	);

});
