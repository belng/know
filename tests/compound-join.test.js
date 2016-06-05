import test from 'ava';
import Cache from '../lib/Cache';

const {
	OrderedArray,
	RangeArray,
} = Cache;

const cache = new Cache();

test.serial('first put', t => {
	cache.put({
		knowledge: { 'thread+(rel:item):createTime!(user:asdf)': new RangeArray(
			[ [ -Infinity, 5 ] ]
		) },
		indexes: { 'thread+(rel:item):createTime!(user:asdf)': new OrderedArray(
			[ 'thread', 'createTime' ],
			[ {
				rel: { id: 'aa_asdf', type: 'rel', item: 'aa' },
				thread: { id: 'aa', type: 'thread', createTime: 3 }
			} ]
		) }
	});
	t.deepEqual(cache.entities, {
		aa_asdf: { id: 'aa_asdf', type: 'rel', item: 'aa' },
		aa: { id: 'aa', type: 'thread', createTime: 3 }
	});

	t.deepEqual(cache.indexes, {
		'thread+(rel:item):createTime!(user:asdf)': new OrderedArray(
			[ 'createTime' ],
			[ { id: 'aa', type: 'thread', createTime: 3 } ]
		),
		'rel-(thread:item)/item!(user:asdf)': {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa' }
		}
	});
});

test.serial('second put', t => {
	cache.put({
		knowledge: { 'thread+(rel:item):createTime!(user:asdf)': new RangeArray(
			[ [ 5, Infinity ] ]
		) },
		indexes: { 'thread+(rel:item):createTime!(user:asdf)': new OrderedArray(
			[ 'thread', 'createTime' ],
			[{
				rel: { id: 'bb_asdf', type: 'rel', item: 'bb' },
				thread: { id: 'bb', type: 'thread', createTime: 6 }
			},
			{
				rel: { id: 'cc_asdf', type: 'rel', item: 'cc' },
				thread: { id: 'cc', type: 'thread', createTime: 7 }
			} ]
		) }
	});

	t.deepEqual(cache.entities, {
		aa_asdf: { id: 'aa_asdf', type: 'rel', item: 'aa' },
		aa: { id: 'aa', type: 'thread', createTime: 3 },
		bb_asdf: { id: 'bb_asdf', type: 'rel', item: 'bb' },
		bb: { id: 'bb', type: 'thread', createTime: 6 },
		cc_asdf: { id: 'cc_asdf', type: 'rel', item: 'cc' },
		cc: { id: 'cc', type: 'thread', createTime: 7 }
	});
	t.deepEqual(cache.indexes, {
		'thread+(rel:item):createTime!(user:asdf)': new OrderedArray(
			[ 'createTime' ],
			[
				{ id: 'aa', type: 'thread', createTime: 3 },
				{ id: 'bb', type: 'thread', createTime: 6 },
				{ id: 'cc', type: 'thread', createTime: 7 }
			]
		),
		'rel-(thread:item)/item!(user:asdf)': {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa' },
			bb: { id: 'bb_asdf', type: 'rel', item: 'bb' },
			cc: { id: 'cc_asdf', type: 'rel', item: 'cc' }
		}
	});
});

test.serial('query', t => {
	let res = cache.query(
		'thread+(rel:item):createTime!(user:asdf)',
		[ 3, 7 ]
	);
	t.deepEqual(res, new OrderedArray(
		[ 'thread', 'createTime' ],
		[ {
			rel: { id: 'aa_asdf', type: 'rel', item: 'aa' },
			thread: { id: 'aa', type: 'thread', createTime: 3 }
		}, {
			rel: { id: 'bb_asdf', type: 'rel', item: 'bb' },
			thread: { id: 'bb', type: 'thread', createTime: 6 }
		}, {
			rel: { id: 'cc_asdf', type: 'rel', item: 'cc' },
			thread: { id: 'cc', type: 'thread', createTime: 7 }
		} ]
	));
});

test('push', t => {
	const cache = new Cache(); //eslint-disable-line
	const key = 'item+(rel:item):score';
	cache.put({
		knowledge: { [key]: [ [ -Infinity, Infinity ] ] },
		indexes: { [key]: [
			{ item: { id: 'item1', type: 'item', score: 1 }, rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
			{ item: { id: 'item2', type: 'item', score: 1 }, rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
			{ item: { id: 'item3', type: 'item', score: 1 }, rel: { id: 'me_item3', type: 'rel', role: 1, item: 'item3' } },
			{ item: { id: 'item4', type: 'item', score: 1 }, rel: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' } }
		] }
	});

	t.deepEqual(
		cache.query(key, [ -Infinity, Infinity ]).arr,
		[ { item: { id: 'item4', type: 'item', score: 1 },
		    rel: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' } },
		  { item: { id: 'item2', type: 'item', score: 1 },
		    rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
		  { item: { id: 'item3', type: 'item', score: 1 },
		    rel: { id: 'me_item3', type: 'rel', role: 1, item: 'item3' } },
		  { item: { id: 'item4', type: 'item', score: 1 },
		    rel: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' } }
		]
	);

	cache.put({
		entities: {
			me_item2: { role: 2 }
		}
	});

	t.deepEqual(
		cache.query(key, [ -Infinity, Infinity ]).arr,
		[ { item: { id: 'item4', type: 'item', score: 1 },
			rel: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' } },
		  { item: { id: 'item2', type: 'item', score: 1 },
			rel: { id: 'me_item2', type: 'rel', role: 2, item: 'item2' } },
		  { item: { id: 'item3', type: 'item', score: 1 },
			rel: { id: 'me_item3', type: 'rel', role: 1, item: 'item3' } },
		  { item: { id: 'item4', type: 'item', score: 1 },
			rel: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' } }
		]
	);
});

test.only('new primary item', t => {
	const cache = new Cache(); //eslint-disable-line
	const key = 'item+(rel:item):score';
	cache.put({
		knowledge: { [key]: [ [ -Infinity, Infinity ] ] },
		indexes: { [key]: [
			{ item: { id: 'item1', type: 'item', score: 1 }, rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
			{ item: { id: 'item2', type: 'item', score: 2 }, rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
		] }
	});

	cache.put({
		entities: {
			item4: { id: 'item4', type: 'item', score: 3 }
		}
	});

	console.log(cache.queries);

	t.deepEqual(
		cache.query(key, [ -Infinity, Infinity ]).arr,
		[ { item: { id: 'item1', type: 'item', score: 1 },
			rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
		  { item: { id: 'item2', type: 'item', score: 2 },
			rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
		  { item: { id: 'item4', type: 'item', score: 3 },
			rel: { type: 'loading' } }
		]
	);
});

test('update primary item', t => {
	const cache = new Cache(); //eslint-disable-line
	const key = 'item+(rel:item):score';
	cache.put({
		knowledge: { [key]: [ [ -Infinity, Infinity ] ] },
		indexes: { [key]: [
			{ item: { id: 'item1', type: 'item', score: 1 }, rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
			{ item: { id: 'item2', type: 'item', score: 2 }, rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
			{ item: { id: 'item3', type: 'item', score: 3 }, rel: { id: 'me_item3', type: 'rel', role: 1, item: 'item3' } },
		] }
	});

	cache.put({
		entities: {
			item2: { id: 'item2', type: 'item', score: 10 }
		}
	});

	t.deepEqual(
		cache.query(key, [ -Infinity, Infinity ]).arr,
		[ { item: { id: 'item1', type: 'item', score: 1 },
			rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
		  { item: { id: 'item3', type: 'item', score: 3 },
			rel: { id: 'me_item3', type: 'rel', role: 1, item: 'item3' } },
		  { item: { id: 'item2', type: 'item', score: 10 },
			rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } }
		]
	);
});
