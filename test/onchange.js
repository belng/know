/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let Cache = require('../lib/Cache').default,
	OrderedArray = Cache.OrderedArray,
	RangeArray = Cache.RangeArray,
	assert = require('assert'),
	util = require('util');

it('should fire one onchange', (done) => {
	let cache = new Cache();

	cache.onChange(changes => console.dir(changes, {depth:null}));

	cache.put({ entities: { foo: { id: 'foo', type: 'boo' } } });
	cache.put({ entities: { bar: { id: 'bar', type: 'boo' } } });

	setTimeout(done, 50);
});
