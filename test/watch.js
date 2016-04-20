/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let assert = require('assert'),
	Cache = require('../lib/Cache').default,
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

it('should fire watch with correct number of results', (done) => {
	const cache = new Cache({
		is: () => true,
		id: entity => entity.id,
	});

	cache.put({
		knowledge: { 'text:createTime!(parents~Scts:(9929e4d6~F39d2~F47c7~Fb595~F6f38729b1a34))': new RangeArray(
			[ [ -Infinity, +Infinity ] ]
		) },
		indexes: { 'text:createTime!(parents~Scts:(9929e4d6~F39d2~F47c7~Fb595~F6f38729b1a34))': new OrderedArray(
			[ 'createTime' ],
			[]
		) }
	});

	let i = 0;

	cache.watch({
		type: 'text',
		filter: {
			parents_cts: [ '9929e4d6-39d2-47c7-b595-6f38729b1a34' ],
		},
		order: 'createTime',
	}, [ Infinity, 20, 0 ], results => {
		if (i === 0) {
			assert.equal(results.arr.length, 1, 'doesnt have item loading ');
			assert.equal(results.arr[0].type, 'loading', 'type is not loading');
		}

		if (i === 1) {
			assert.equal(results.arr.length, 1);
			assert.equal(results.arr[0].type, 2);
		}

		if (i === 2) {
			assert.equal(results.arr.length, 2);
			done();
		}

		i++;
	});

	setTimeout(() =>
		cache.put({
			entities: {
				'7c81733b-a28a-484d-a152-91aa3ecfb6f6': {
					body: 'Test 1',
					createTime: 1461159560709,
					creator: 'satya164',
					id: '7c81733b-a28a-484d-a152-91aa3ecfb6f6',
					parents: [
						'9929e4d6-39d2-47c7-b595-6f38729b1a34',
						'0fc369e4-fbd9-4592-973b-82d9a4b17967'
					],
					tags: [],
					type: 2,
					updateTime: 1461159560709
				}
			}
		}), 100);

	setTimeout(() =>
		cache.put({
			entities: {
				'7c81733b-a28a-484d-a152-91aa3ecfb67': {
					body: 'Test 2',
					createTime: 1461159560710,
					creator: 'satya164',
					id: '7c81733b-a28a-484d-a152-91aa3ecfb6f7',
					parents: [
						'9929e4d6-39d2-47c7-b595-6f38729b1a34',
						'0fc369e4-fbd9-4592-973b-82d9a4b17967'
					],
					tags: [],
					type: 2,
					updateTime: 1461159560710
				}
			}
		}), 300);
});
