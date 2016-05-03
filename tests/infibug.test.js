import test from 'ava';
import Cache from '../lib/Cache';

const {
	RangeArray,
	OrderedArray,
} = Cache;

test.cb('infinite ranges should not be queried unnecessarily', t => {
	let cache = new Cache();

	cache.put({
		knowledge: { 'asdf:xyz!(:)': [ [ 12345, Infinity ] ] },
		indexes: { 'asdf:xyz!(:)': [] }
	});

	cache.onChange((changes) => {
		t.deepEqual(
			changes.queries['asdf:xyz!(:)'].arr,
			[ [ 12345, 20, 0 ] ]
		);
		t.end();
	});

	cache.query('asdf:xyz!(:)', [ 12345, 20, 0 ], () => {});
});


test('should avoid duplicates', t => {
	let cache = new Cache();

	cache.put({
		knowledge: { 'asdf:xyz!(:)': [ [ 10, Infinity ] ] },
		indexes: { 'asdf:xyz!(:)': [
			{ id: 1, type: 'asdf', xyz: 10 },
			{ id: 2, type: 'asdf', xyz: 12 }
		] }
	});

	cache.put({
		knowledge: { 'asdf:xyz!(:)': [ [ 5, 10 ] ] },
		indexes: { 'asdf:xyz!(:)': [
			{ id: 5, type: 'asdf', xyz: 5 },
			{ id: 4, type: 'asdf', xyz: 7 },
			{ id: 1, type: 'asdf', xyz: 10 }
		] }
	});

	t.deepEqual(cache.indexes['asdf:xyz!(:)'].arr, [
		{ id: 5, type: 'asdf', xyz: 5 },
		{ id: 4, type: 'asdf', xyz: 7 },
		{ id: 1, type: 'asdf', xyz: 10 },
		{ id: 2, type: 'asdf', xyz: 12 }
	]);
});
