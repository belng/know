import test from 'ava';
import RangeArray from '../lib/RangeArray';
import OrderedArray from '../lib/OrderedArray';

test('should handle infinities correctly', t => {
	t.deepEqual(
		RangeArray.countedToBounded(
			RangeArray.makeRange([ Infinity, 3, 0 ]),
			new OrderedArray([ 'createTime' ], [
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
	t.deepEqual(RangeArray.countedToBounded(
		RangeArray.makeRange([ Infinity, 3, 0 ]),
		new OrderedArray([ 'asdf' ], [])
	), new RangeArray(
		[ [ -Infinity, Infinity ] ]
	));
});
