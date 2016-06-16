import test from 'ava';
import Cache from '../lib/Cache';

const {
	OrderedArray,
	RangeArray,
} = Cache;

const cache = new Cache(),
	key = 'thread+(rel:item):createTime!(rel:(user:asdf))',
	dKey = 'rel-(thread:item)/item!(rel:(user:asdf))';

test.serial('first put', t => {
	cache.put({
		knowledge: { [key]: new RangeArray(
			[ [ -Infinity, 5 ] ]
		) },
		indexes: { [key]: new OrderedArray(
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
		[key]: new OrderedArray(
			[ 'createTime' ],
			[ { id: 'aa', type: 'thread', createTime: 3 } ]
		),
		[dKey]: {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa' }
		}
	});
});

test.serial('second put', t => {
	cache.put({
		knowledge: { [key]: new RangeArray(
			[ [ 5, Infinity ] ]
		) },
		indexes: { [key]: new OrderedArray(
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
		[key]: new OrderedArray(
			[ 'createTime' ],
			[
				{ id: 'aa', type: 'thread', createTime: 3 },
				{ id: 'bb', type: 'thread', createTime: 6 },
				{ id: 'cc', type: 'thread', createTime: 7 }
			]
		),
		[dKey]: {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa' },
			bb: { id: 'bb_asdf', type: 'rel', item: 'bb' },
			cc: { id: 'cc_asdf', type: 'rel', item: 'cc' }
		}
	});
});

test.serial('query', t => {
	const res = cache.query(key, [ 3, 7 ]);
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

test('new primary item', t => {
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

	t.deepEqual(
		cache.query(key, [ -Infinity, Infinity ]).arr,
		[ { item: { id: 'item1', type: 'item', score: 1 },
			rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
		  { item: { id: 'item2', type: 'item', score: 2 },
			rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
		  { item: { id: 'item4', type: 'item', score: 3 },
			rel: null }
			// rel: { type: 'loading' } }
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

test('make queries for secondary items only when need', t => {
	const c = new Cache();

	const rKey = 'item+(rel:item):createTime';
	// const dualKey = 'rel-(item:item)/item';

	c.put({
		knowledge: { [rKey]: [ [ 1, 5 ] ] },
		indexes: { [rKey]: [ {
			item: {
				id: 'i1',
				createTime: 1,
				type: 'item'
			},
			rel: {
				id: 'r1',
				item: 'i1',
				type: 'rel'
			}
		}, {
			item: {
				id: 'i2',
				createTime: 2,
				type: 'item'
			}
		}, {
			item: {
				id: 'i3',
				createTime: 3,
				type: 'item'
			}
		} ] }
	});


	let results = c.query(rKey, [ 1, 5 ]);

	results = results.arr.filter(e => e.rel && e.rel.type === 'loading');
	t.deepEqual(results.length, 0);
	c.put({
		entities: {
			i4: {
				createTime: 4,
				id: 'i4',
				type: 'item'
			}
		}
	});

	// t.deepEqual(c.query(rKey , [ 1, 5 ]).arr.filter(e => e.rel && e.rel.type === 'loading').length, 1);
});


test.cb('new primary item and secondary', t => {
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
			me_item4: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' },
			item4: { id: 'item4', type: 'item', score: 3 },
		}
	});

	cache.query(key, [ -Infinity, Infinity ], (err, res) => {
		t.deepEqual(res.arr, [ { item: { id: 'item1', type: 'item', score: 1 },
			rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
		  { item: { id: 'item2', type: 'item', score: 2 },
			rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
		  { item: { id: 'item4', type: 'item', score: 3 },
			rel: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' } }
		]);
		t.end();
	});
});



test.cb('new primary item and secondary 2', t => {
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
			me_item4: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' },
			item4: { id: 'item4', type: 'item', score: 3 }
		}
	});

	cache.query(key, [ -Infinity, Infinity ], (err, res) => {
		t.deepEqual(res.arr, [ { item: { id: 'item1', type: 'item', score: 1 },
			rel: { id: 'me_item1', type: 'rel', role: 1, item: 'item1' } },
		  { item: { id: 'item2', type: 'item', score: 2 },
			rel: { id: 'me_item2', type: 'rel', role: 1, item: 'item2' } },
		  { item: { id: 'item4', type: 'item', score: 3 },
			rel: { id: 'me_item4', type: 'rel', role: 1, item: 'item4' } }
		]);
		t.end();
	});
});
