/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let Cache = require('../lib/Cache').default,
	RangeArray = Cache.RangeArray,
	OrderedArray = Cache.OrderedArray,
	assert = require('assert');

it('-Infinity queries should be clamped', () => {
	let cache = new Cache();

	cache.onChange(change => {
		assert.deepEqual(change.queries['text:createTime'],
			new RangeArray([ [ -Infinity, 0, 10 ] ])
		);
	});

	cache.query('text:createTime', [ -Infinity, 10, 10 ]);
});

it('+Infinity queries should be clamped', () => {
	let cache = new Cache();

	cache.onChange(change => {
		assert.deepEqual(change.queries['text:createTime'],
			new RangeArray([ [ Infinity, 10, 0 ] ])
		);
	});

	cache.query('text:createTime', [ Infinity, 10, 10 ]);
});

it('Empty results', (done) => {
	let cache = new Cache();

	cache.onChange(change => {
		if (change.queries) {
			cache.put({
				knowledge: { 'note:updateTime!(user:satya164)': new RangeArray(
					[[-Infinity, +Infinity]]
				) },
				indexes: { 'note:updateTime!(user:satya164)': new OrderedArray(
					['updateTime'],
					[]
				)}
			});
		}
	});

	cache.query(
		'note:updateTime!(user:satya164)',
		[Infinity, 100, 0],
		(err, results) => { assert.deepEqual(results.arr, []); done(); }
	);

});
