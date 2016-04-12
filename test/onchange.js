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
	let cache = new Cache({});

	cache.onChange(changes => {
		assert.deepEqual(changes, {
			entities: {
				foo: { id: 'foo', type: 'boo' },
				bar: { id: 'bar', type: 'boo' }
			}
		});
		done();
	});

	cache.put({ entities: { foo: { id: 'foo', type: 'boo' } } });
	cache.put({ entities: { bar: { id: 'bar', type: 'boo' } } });
});



it('should fire onchange twice', (done) => {
	let cache = new Cache({}), count = 0;

	cache.onChange(changes => {
		count++;

		if (count === 1){
			assert.deepEqual(changes, {
				entities: {
					foo: { id: 'foo', type: 'boo' }
				},
				source: 'server'
			});
		}

		if (count === 2) {
			assert.deepEqual(changes, {
				entities: {
					bar: { id: 'bar', type: 'boo' }
				}
			});
			done();
		}
	});

	cache.put({ entities: { foo: { id: 'foo', type: 'boo' } }, source: 'server'  });
	cache.put({ entities: { bar: { id: 'bar', type: 'boo' } } });
});
