import test from 'ava';
import Cache from '../lib/Cache';

const {
	RangeArray,
	OrderedArray,
} = Cache;

test('should handle infinities correctly', t => {
	let cache = new Cache();
	t.deepEqual(
		cache.countedToBounded(
			RangeArray.makeRange([ Infinity, 3, 0 ]),
			new OrderedArray([ "createTime" ], [
				{ id: 'blahblah1', type: 'text', createTime: 21 },
				{ id: 'blahblah2', type: 'text', createTime: 22 },
				{ id: 'blahblah3', type: 'text', createTime: 23 },
				{ id: 'blahblah4', type: 'text', createTime: 24 },
				{ id: 'blahblah5', type: 'text', createTime: 25 }
			])
		),
		new RangeArray([ [ 23, Infinity ] ])
	);

});

test('should return infinity for empty', t => {
	let cache = new Cache();
	t.deepEqual(cache.countedToBounded(
		RangeArray.makeRange([ Infinity, 3, 0 ]),
		new OrderedArray([ 'asdf' ], [])
	), new RangeArray(
		[ [ -Infinity, Infinity ] ]
	));
});
