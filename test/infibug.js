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
		assert.deepEqual(
			changes.queries['asdf:xyz!(:)'].arr,
			[ [ 12345, 20, 0 ] ]
		);
		done();
	});

	cache.query('asdf:xyz!(:)', [12345, 20, 0], () => {});
});


it('should avoid duplicates', () => {
	let cache = new Cache();

	cache.put({
		knowledge: {'asdf:xyz!(:)': [[ 10, Infinity ]]},
		indexes: {'asdf:xyz!(:)': [
			{ id: 1, type: 'asdf', xyz: 10},
			{ id: 2, type: 'asdf', xyz: 12}
		]}
	});

	cache.put({
		knowledge: { 'asdf:xyz!(:)': [ [ 5, 10 ] ] },
		indexes: { 'asdf:xyz!(:)': [
			{ id: 5, type: 'asdf', xyz: 5 },
			{ id: 4, type: 'asdf', xyz: 7 },
			{ id: 1, type: 'asdf', xyz: 10 }
		] }
	});

	assert.deepEqual(cache.indexes['asdf:xyz!(:)'].arr, [
		{ id: 5, type: 'asdf', xyz: 5 },
		{ id: 4, type: 'asdf', xyz: 7 },
		{ id: 1, type: 'asdf', xyz: 10 },
		{ id: 2, type: 'asdf', xyz: 12}
	]);
});
