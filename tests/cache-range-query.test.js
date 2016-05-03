import test from 'ava';
import Cache from '../lib/Cache';

const { OrderedArray } = Cache;
const cache = new Cache();

cache.put({
	knowledge: { 'room:updateTime!(:)': [ [ 0, 7 ] ] },
	indexes: { 'room:updateTime!(:)': [
		{ id: 'numix', updateTime: 1 },
		{ id: 'scrollback', updateTime: 3 },
		{ id: 'bangalore', updateTime: 6 }
	] }
});

test('simple query', t => {
	let res = cache.query('room:updateTime!(:)', [ 1, 5 ]);

	t.is(res.get().length, 2, 'incorrect results');
	t.is(res.get(0).updateTime, 1, 'incorrect item');
	t.is(res.get(1).updateTime, 3, 'incorrect item');
});

test('query with loading at the end', t => {
	let res = cache.query('room:updateTime!(:)', [ 1, 9 ]);
	t.is(res.get().length, 4, 'incorrect results');
	t.is(res.get(0).updateTime, 1, 'incorrect item');
	t.is(res.get(1).updateTime, 3, 'incorrect item');
	t.is(res.get(2).updateTime, 6, 'incorrect item');
	t.is(res.get(3).updateTime, 7, 'incorrect item');
	t.is(res.get(3).type, 'loading', 'incorrect item');
});

test('query with 3 property ranges with after only single item', t => {
	let res = cache.query('room:updateTime!(:)', [ 3, 0, 1 ]);
	t.is(res.get().length, 1, 'incorrect results');
	t.is(res.get(0).updateTime, 3, 'incorrect item');
});

test('query with 3 property ranges with after only: multiple items with no loading', t => {
	let res = cache.query('room:updateTime!(:)', [ 1, 0, 3 ]);
	t.is(res.get().length, 3, 'incorrect results');
	t.is(res.get(0).updateTime, 1, 'incorrect item');
	t.is(res.get(1).updateTime, 3, 'incorrect item');
	t.is(res.get(2).updateTime, 6, 'incorrect item');
});

test.cb('Cache.query should fire callback on getting data', t => {
	cache.onChange(function(changes) {
		if (changes.queries && changes.queries['text:createTime']) {
			cache.put({
				knowledge: {
					'text:createTime': new Cache.RangeArray([ [ 1, 3 ] ])
				},
				indexes: {
					'text:createTime': new Cache.OrderedArray(
						[ 'createTime' ], [
							{
								createTime: 1,
								type: 'text',
								body: 'hi',
								id: 'aksdfjn'
							},
							{
								createTime: 2,
								type: 'text',
								body: 'hi',
								id: 'askdjfkshd'
							},
							{
								createTime: 3,
								type: 'text',
								body: 'hi',
								id: 'aksdcilaeukajsn'
							}
						]
					)
				}
			});
		}
	});

	let res = cache.query(
		cache.sliceToKey({ type: 'text', order: 'createTime'}),
		[ 1, 3 ],
		function(err, data) {
			t.falsy(err, 'Error thrown');
			t.is(data.length, 3, 'callback fired with new items');
			t.end();
		}
	);

	t.deepEqual(res, new OrderedArray([ 'createTime' ], [
		{ type: "loading", createTime: 1, start: 1, end: 3 }
	]));

});
