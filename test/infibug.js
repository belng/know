/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let Cache = require('../lib/Cache').default,
	OrderedArray = Cache.OrderedArray,
	assert = require('assert');

it('infinite ranges should not be queried unnecessarily', (done) => {
	let cache = new Cache();

	cache.put({
		knowledge: {'asdf:xyz!(:)': [[ 12345, Infinity ]]},
		indexes: {'asdf:xyz!(:)': []}
	});

	cache.onChange((changes) => {
		console.log("HERE!", changes.queries['asdf:xyz!(:)']);
		done();
	});

	cache.query('asdf:xyz!(:)', [12345, 20, 0], () => {});
});
