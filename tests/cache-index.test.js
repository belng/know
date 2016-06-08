import test from 'ava';
import Cache from '../lib/Cache';

const {
	OrderedArray,
} = Cache;

test('adding knowledge should add the indexes', t => {
	const cache = new Cache({
		is: (entity, type) => { return type === 'relation'; }
	});
	cache.put({
		entities: {
			harish_numix: { id: 'harish_numix', roleTime: 1 },
			aravind_numix: { id: 'aravind_numix', roleTime: 3 },
			satya_numix: { id: 'satya_numix', roleTime: 6 }
		}
	});
	cache.put({
		knowledge: { 'relation:roleTime!(:)': [ [ 0, +Infinity ] ] }
	});
	t.truthy(Object.keys(cache.indexes).length, 'no index added');
});

test('item should be deleted', t => {
	const cache = new Cache();
	cache.put({
		knowledge: { 'room:updateTime!(:)': [ [ 0, 7 ] ] },
		indexes: { 'room:updateTime!(:)': [
			{ id: 'numix', type: 'room', updateTime: 1 },
			{ id: 'scrollback', type: 'room', updateTime: 3 },
			{ id: 'bangalore', type: 'room', updateTime: 6 }
		] }
	});

	cache.put({
		entities: {
			numix: null
		}
	});
	let res = cache.query('room:updateTime!(:)', [ 1, 9 ]);
	t.truthy(res.get(0).id !== 'numix', 'didnt delete');
});

test('item should be deleted from index when filter is not valid', t => {
	const cache = new Cache();
	cache.put({
		knowledge: { 'room:updateTime!(p:3)': [ [ 0, 7 ] ] },
		indexes: { 'room:updateTime!(p:3)': [
			{ id: 'numix', type: 'room', updateTime: 1, p: 3 },
			{ id: 'scrollback', type: 'room', updateTime: 3, p: 3 },
			{ id: 'bangalore', type: 'room', updateTime: 6, p: 3 }
		] }
	});

	cache.put({
		entities: {
			numix: { id: 'numix', type: 'room', updateTime: 1, p: 4 }
		}
	});

	const res = cache.query('room:updateTime!(p:3)', [ 1, 9 ]);
	t.true(res.get(0).id !== 'numix', 'didnt delete');
});

test.cb("getEntity callback fired when indexes are put", t => {
	let cache = new Cache();
	cache.getEntity("test123", (err, entity) => {
		t.deepEqual(entity, {id: 'test123', type: 'room', updateTime: 3});
		t.end();
	});
	cache.put({
		knowledge: { 'room:updateTime!(:)': [ [ 0, 7 ] ] },
		indexes: { 'room:updateTime!(:)': [
			{ id: 'test123', type: 'room', updateTime: 3 }
		] }
	});
});

/*
	TODO:
	Existing entities should be indexed when adding knowledge.
	Queries should be added to cache.queries
	Cache._recentQueries should be updated
*/
test.todo('Existing entities should be indexed when adding knowledge');
