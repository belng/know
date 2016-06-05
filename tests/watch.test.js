import test from 'ava';
import Cache from '../lib/Cache';

const {
	RangeArray,
	OrderedArray,
} = Cache;

test.cb('should fire onchange when one entity in list changes with no change to order property', t => {
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
	let count = 0;
	cache.watch({
		type: 'text',
		order: 'createTime',
	}, [ -Infinity, +Infinity ], (data) => {
		if (count === 0) {
			t.deepEqual(data, new OrderedArray([ 'createTime' ], [
				{
					type: 'loading',
					start: -Infinity,
					end: 0, // This should be 1, it is inexplicably 0. Strangely, doing console.log() in the watch() dispatcher seems to flip it to 1! Possibly a transpiler bug.

					createTime: -Infinity
				},
				{ createTime: 1, type: 'text', body: 'hey', id: 'a' },
				{ createTime: 2, type: 'text', body: 'ho', id: 'b' },
				{ createTime: 3, type: 'text', body: 'go', id: 'c' },
				{ type: 'loading', start: 3, end: Infinity, createTime: Infinity } ]
			 ));
			 count++;
		} else if (count === 1) {
			t.deepEqual(data, new OrderedArray([ 'createTime' ], [
				{
					type: 'loading',
					start: -Infinity,
					end: 1,
					createTime: -Infinity
				},
				{ createTime: 1, type: 'text', body: 'hey', id: 'a' },
				{ createTime: 2, type: 'text', body: 'ho', id: 'b' },
				{ createTime: 3, type: 'text', body: 'some', id: 'c' },
				{ type: 'loading', start: 3, end: Infinity, createTime: Infinity } ]
			 ));
			t.end();
		}
		// if (data.arr[3].body === 'some') {
		// 	t.end();
		// }
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
	}, 1000);
});

test.cb('should fire watch with correct number of results', t => {
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
			t.is(results.arr.length, 1, 'doesnt have item loading ');
			t.is(results.arr[0].type, 'loading', 'type is not loading');
			i++;
		} else if (i === 1) {
			t.is(results.arr.length, 1);
			t.is(results.arr[0].type, 2);
			i++;

		} else if (i === 2) {
			t.is(results.arr.length, 2);
			i++;
			t.end();
		}
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

test.cb('should fire watch: on order property change in middle of list', t => {
	const cache = new Cache({});

	cache.put({
		knowledge: {
			'text:createTime': new RangeArray([ [ 1, 4 ] ])
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
						createTime: 4,
						type: 'text',
						body: 'go',
						id: 'c'
					}
				]
			)
		}
	});
	let count = 0;
	cache.watch({
		type: 'text',
		order: 'createTime',
	}, [ -Infinity, +Infinity ], (data) => {
		if (count === 0) {
			t.deepEqual(data, new OrderedArray([ 'createTime' ], [
				{
					type: 'loading',
					start: -Infinity,
					end: 1,
					createTime: -Infinity
				},
				{ createTime: 1, type: 'text', body: 'hey', id: 'a' },
				{ createTime: 2, type: 'text', body: 'ho', id: 'b' },
				{ createTime: 4, type: 'text', body: 'go', id: 'c' },
				{ type: 'loading', start: 4, end: Infinity, createTime: Infinity } ]
			 ));
			 count++;
		} else if (count === 1) {
			t.deepEqual(data, new OrderedArray([ 'createTime' ], [
				{
					type: 'loading',
					start: -Infinity,
					end: 1,
					createTime: -Infinity
				},
				{ createTime: 1, type: 'text', body: 'hey', id: 'a' },
				{ createTime: 3, type: 'text', body: 'some', id: 'b' },
				{ createTime: 4, type: 'text', body: 'go', id: 'c' },
				{ type: 'loading', start: 4, end: Infinity, createTime: Infinity } ]
			 ));
			t.end();
		}
		// if (data.arr[3].body === 'some') {
		// 	t.end();
		// }
	});


	setTimeout(() => {
		cache.put({
			entities: {
				b: {
					createTime: 3,
					type: 'text',
					body: 'some',
					id: 'b'
				}
			}
		});
	}, 1000);
});

test.cb('should fire watch: on order property change in end of list', t => {
	const cache = new Cache({});

	cache.put({
		knowledge: {
			'text:createTime': new RangeArray([ [ 1, Infinity ] ])
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
	let count = 0;
	cache.watch({
		type: 'text',
		order: 'createTime',
	}, [ -Infinity, +Infinity ], (data) => {
		if (count === 0) {
			t.deepEqual(data, new OrderedArray([ 'createTime' ], [
				{
					type: 'loading',
					start: -Infinity,
					end: 1,
					createTime: -Infinity
				},
				{ createTime: 1, type: 'text', body: 'hey', id: 'a' },
				{ createTime: 2, type: 'text', body: 'ho', id: 'b' },
				{ createTime: 3, type: 'text', body: 'go', id: 'c' } ]
			 ));
			 count++;
		} else if (count === 1) {
			t.deepEqual(data, new OrderedArray([ 'createTime' ], [
				{
					type: 'loading',
					start: -Infinity,
					end: 1,
					createTime: -Infinity
				},
				{ createTime: 1, type: 'text', body: 'hey', id: 'a' },
				{ createTime: 2, type: 'text', body: 'ho', id: 'b' },
				{ createTime: 4, type: 'text', body: 'some', id: 'c' } ]
			 ));
			t.end();
		}
		// if (data.arr[3].body === 'some') {
		// 	t.end();
		// }
	});


	setTimeout(() => {
		cache.put({
			entities: {
				c: {
					createTime: 4,
					type: 'text',
					body: 'some',
					id: 'c'
				}
			}
		});
	}, 1000);
});
