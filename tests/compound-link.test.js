import test from 'ava';
import Cache from '../lib/Cache';

const {
	OrderedArray,
	RangeArray,
} = Cache;

const cache = new Cache();
const key = 'rel-(room:item):roleTime!(rel:(roles~Scts:(+3),user:asdf))',
	dKey = 'rel-(room:item)/item!(rel:(roles~Scts:(+3),user:asdf))';

test.serial('first put', t => {
	cache.put({
		knowledge: { [key]: new RangeArray(
			[ [ -Infinity, 5 ] ]
		) },
		indexes: { [key]: new OrderedArray(
			['rel', 'roleTime'],
			[{
				rel: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
				room: { id: 'aa', type: 'room' }
			}]
		)}
	});
	t.deepEqual(cache.entities, {
		aa_asdf: {
			id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3]
		},
		aa: { id: 'aa', type: 'room' }
	});
	t.deepEqual(cache.indexes, {
		[key]: new OrderedArray(
			[ 'roleTime' ],
			[{
				id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf',roleTime: 4, roles: [41, 3]
			}]
		),
		[dKey]: {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf',roleTime: 4, roles: [41, 3] }
		}
	});
});

test.serial('second put', t => {
	cache.put({
		knowledge: { [key]: new RangeArray(
			[[5, Infinity]]
		)},
		indexes: { [key]: new OrderedArray(
			[ 'rel', 'roleTime' ],
			[ {
				rel: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf',roleTime: 7, roles: [41, 3] },
				room: { id: 'bb', type: 'room' }
			}, {
				rel: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf',roleTime: 8, roles: [41, 3] },
				room: { id: 'cc', type: 'room' }
			} ]
		)}
	});
	t.deepEqual(cache.entities, {
		aa_asdf: {
			id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf',roleTime: 4, roles: [41, 3]
		},
		aa: { id: 'aa', type: 'room' },
		bb_asdf: {
			id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf',roleTime: 7, roles: [41, 3]
		},
		bb: { id: 'bb', type: 'room' },
		cc_asdf: {
			id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3]
		},
		cc: { id: 'cc', type: 'room' }
	});
	t.deepEqual(cache.indexes, {
		[key]: new OrderedArray(
			[ 'roleTime' ],
			[ {
				id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3]
			}, {
				id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3]
			}, {
				id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3]
			} ]
		),
		[dKey]: {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
			bb: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
			cc: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] }
		}
	});
});

test.serial('query', t => {
	let res = cache.query(key, [ 3, 7 ]);
	t.deepEqual(res, new OrderedArray(
		['rel', 'roleTime'],
		[{
			rel: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
			room: { id: 'aa', type: 'room' }
		}, {
			rel: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
			room: { id: 'bb', type: 'room' }
		}]
	));
});

test.serial('push', t => {
	cache.put({
		entities: {
			dd_asdf: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] }
		}
	});

	// console.log(require('util').inspect(cache.indexes, {depth: Infinity}));

	t.deepEqual(cache.indexes, {
		[key]: new OrderedArray(
			[ 'roleTime' ],
			[
				{ id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
				{ id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
				{ id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
				{ id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] }
			]
		),
		[dKey]: {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
			bb: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
			cc: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
			dd: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] }
		}
	});
});

test.skip.serial.cb('watch with partial gap', t => {
	let flag = false,
		unwatch = cache.watch(key, [ 6, 9 ], function (res) {
			if (!flag) {
				t.deepEqual(res, new OrderedArray(
					[ 'rel', 'roleTime' ],
					[
						{ rel: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
						room: { id: 'bb', type: 'room' } },
						{ rel: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
						room: { id: 'cc', type: 'room' } },
						{ rel: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] },
						room: { type: 'loading' } }
					]
				));
				flag = true;
			} else {
				t.deepEqual(res, new OrderedArray(
					[ 'rel', 'roleTime' ],
					[
						{ rel: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
						room: { id: 'bb', type: 'room' } },
						{ rel: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
						room: { id: 'cc', type: 'room' } },
						{ rel: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] },
						room: { id: 'dd', type: 'room' } }
					]
				));
				unwatch();
				t.end();
			}
		}
	);

	t.deepEqual(cache.queries, { entities: { dd: true } });

	setTimeout(() => {
		cache.put({ entities: { dd: { id: 'dd', type: 'room' }}});
	}, 10);
});

test.serial('remove', t => {
	cache.put({
		entities: {
			dd_asdf: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [] }
		}
	});

	t.deepEqual(cache.indexes, {
		[key]: new OrderedArray(
			[ 'roleTime' ],
			[
				{ id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
				{ id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
				{ id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] }
			]
		),
		[dKey]: {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
			bb: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
			cc: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] }
		}
	});
});

test.serial('entity and rel put:', t => {
	cache.put({
		entities: {
			dd: {id: 'dd', type: 'room'},
			ee: {id: 'ee', type: 'room'},
			dd_asdf: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] },
			ee_asdf: { id: 'ee_asdf', type: 'rel', item: 'ee', user: 'asdf', roleTime: 10, roles: [41, 3] }
		}
	});

	t.deepEqual(cache.indexes, {
		[key]: new OrderedArray(
			[ 'roleTime' ],
			[
				{ id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
				{ id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
				{ id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
				{ id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] },
				{ id: 'ee_asdf', type: 'rel', item: 'ee', user: 'asdf', roleTime: 10, roles: [41, 3] }
			]
		),
		[dKey]: {
			aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
			bb: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
			cc: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
			dd: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] },
			ee: { id: 'ee_asdf', type: 'rel', item: 'ee', user: 'asdf', roleTime: 10, roles: [41, 3] }
		}
	});
});
