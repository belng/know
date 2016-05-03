import test from 'ava';
import Cache from '../lib/Cache';

const cache = new Cache({
	is: (entity, type) => { return type === 'relation'; }
});
cache.put({
	knowledge: { 'relation:roleTime!(:)': [ [ 0, +Infinity ] ] },
	indexes: { 'relation:roleTime!(:)': [
		{ id: 'harish_numix', roleTime: 1 },
		{ id: 'satya_numix', roleTime: 3 },
		{ id: 'aravind_numix', roleTime: 6 }
	] }
});

test('query with 2 prop ranges', t => {
	let res = cache.query('relation:roleTime!(:)', [ 1, 9 ]);
	t.is(res.get(0).roleTime, 1, 'incorrect item');
	t.is(res.get(1).roleTime, 3, 'incorrect item');
	t.is(res.get(2).roleTime, 6, 'incorrect item');
});

test("query with 3 prop ranges: shouldn't return loading at the end.", t => {
	let res = cache.query('relation:roleTime!(:)', [ 3, 0, 3 ]);
	t.is(res.get().length, 2, 'incorrect results');
	t.is(res.get(0).roleTime, 3, 'incorrect item');
	t.is(res.get(1).roleTime, 6, 'incorrect item');
});
test('query with 3 prop ranges: should give loading in the beginning and add a query.', t => {
	let res = cache.query('relation:roleTime!(:)', [ 3, 2, 3 ]);

	t.is(res.get().length, 4, 'length not correct on ');
	t.is(res.get(0).type, 'loading', 'incorrect item');
	t.is(res.get(1).roleTime, 1, 'incorrect item');
	t.is(res.get(2).roleTime, 3, 'incorrect item');
	t.is(res.get(3).roleTime, 6, 'incorrect item');
	t.truthy(Object.keys(cache.queries).length, 'no queries added');
});
