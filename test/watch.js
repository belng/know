/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let Cache = require('../lib/Cache').default,
	RangeArray = Cache.RangeArray,
	OrderedArray = Cache.OrderedArray;

it('should fire onchange when one entity in list changes', (done) => {
	const cache = new Cache({});

	cache.put({
		knowledge: {
			'text:createTime': new RangeArray([ [ 1, 3 ] ])
		},
		indexes: {
			'text:createTime': new OrderedArray(
				[ 'createTime' ], [
					{
						createTime: 1,
						type: 'text',
						body: 'hey',
						id: 'a'
					},
					{
						createTime: 2,
						type: 'text',
						body: 'ho',
						id: 'b'
					},
					{
						createTime: 3,
						type: 'text',
						body: 'go',
						id: 'c'
					}
				]
			)
		}
	});

	cache.watch({
		type: 'text',
		order: 'createTime',
	}, [ -Infinity, +Infinity ], (data) => {
		if (data.arr[3].body === 'some') {
			done();
		}
	});

	setTimeout(() => {
		cache.put({
			entities: {
				c: {
					createTime: 3,
					type: 'text',
					body: 'some',
					id: 'c'
				}
			}
		});
	}, 10);
});
