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

test.serial.todo('push');
