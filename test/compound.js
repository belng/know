/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let Cache = require('../lib/Cache').default,
	OrderedArray = Cache.OrderedArray,
	RangeArray = Cache.RangeArray,
	assert = require('assert'),
	util = require('util');

describe('link', () => {
	let cache = new Cache();

	it ('first put', () => {
		cache.put({
			knowledge: { 'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new RangeArray(
				[[-Infinity, 5]]
			)},
			indexes: { 'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new OrderedArray(
				['rel', 'roleTime'],
				[{
					rel: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
					room: { id: 'aa', type: 'room' }
				}]
			)}
		});
		assert.deepEqual(cache.entities, {
			aa_asdf: {
				id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3]
			},
			aa: { id: 'aa', type: 'room' }
		});
		assert.deepEqual(cache.indexes, {
			'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new OrderedArray(
				[ 'roleTime' ],
				[{
					id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf',roleTime: 4, roles: [41, 3]
				}]
			),
			'rel-(room:item)/item!(roles~Scts:(+3),user:asdf)': {
				aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf',roleTime: 4, roles: [41, 3] }
			}
		});
	});

	it ('second put', () => {
		cache.put({
			knowledge: { 'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new RangeArray(
				[[5, Infinity]]
			)},
			indexes: { 'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new OrderedArray(
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
		assert.deepEqual(cache.entities, {
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
		assert.deepEqual(cache.indexes, {
			'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new OrderedArray(
				[ 'roleTime' ],
				[ {
					id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3]
				}, {
					id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3]
				}, {
					id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3]
				} ]
			),
			'rel-(room:item)/item!(roles~Scts:(+3),user:asdf)': {
				aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
				bb: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
				cc: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] }
			}
		});
	});

	it ('query', () => {
		let res = cache.query('rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)', [ 3, 7 ]);
		assert.deepEqual(res, new OrderedArray(
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

	it('push', () => {
		cache.put({
			entities: {
				dd_asdf: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] }
			}
		});

		assert.deepEqual(cache.indexes, {
			'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new OrderedArray(
				[ 'roleTime' ],
				[
					{ id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
					{ id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
					{ id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
					{ id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] }
				]
			),
			'rel-(room:item)/item!(roles~Scts:(+3),user:asdf)': {
				aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
				bb: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
				cc: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] },
				dd: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [41, 3] }
			}
		});
	});

	it('watch with partial gap', (done) => {
		let flag = false,
			res = cache.watch(
			'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)',
			[ 6, 9 ],
			function (res) {
				if (!flag) {
					assert.deepEqual(res, new OrderedArray(
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
					assert.deepEqual(res, new OrderedArray(
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
					done();
					res();
				}
			}
		);
		assert.deepEqual(cache.queries, { entities: { dd: true } });

		setTimeout(() => {
			cache.put({ entities: { dd: { id: 'dd', type: 'room' }}});
		}, 10);
	});

	it('splice', () => {
		cache.put({
			entities: {
				dd_asdf: { id: 'dd_asdf', type: 'rel', item: 'dd', user: 'asdf', roleTime: 9, roles: [] }
			}
		});

		assert.deepEqual(cache.indexes, {
			'rel-(room:item):roleTime!(roles~Scts:(+3),user:asdf)': new OrderedArray(
				[ 'roleTime' ],
				[
					{ id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
					{ id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
					{ id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] }
				]
			),
			'rel-(room:item)/item!(roles~Scts:(+3),user:asdf)': {
				aa: { id: 'aa_asdf', type: 'rel', item: 'aa', user: 'asdf', roleTime: 4, roles: [41, 3] },
				bb: { id: 'bb_asdf', type: 'rel', item: 'bb', user: 'asdf', roleTime: 7, roles: [41, 3] },
				cc: { id: 'cc_asdf', type: 'rel', item: 'cc', user: 'asdf', roleTime: 8, roles: [41, 3] }
			}
		});
	});
});

describe('join', () => {
	let cache = new Cache();

	it ('first put', () => {
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
		assert.deepEqual(cache.entities, {
			aa_asdf: { id: 'aa_asdf', type: 'rel', item: 'aa' },
			aa: { id: 'aa', type: 'thread', createTime: 3 }
		});

		assert.deepEqual(cache.indexes, {
			'thread+(rel:item):createTime!(user:asdf)': new OrderedArray(
				[ 'createTime' ],
				[ { id: 'aa', type: 'thread', createTime: 3 } ]
			),
			'rel-(thread:item)/item!(user:asdf)': {
				aa: { id: 'aa_asdf', type: 'rel', item: 'aa' }
			}
		});
	});

	it ('second put', () => {
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

		assert.deepEqual(cache.entities, {
			aa_asdf: { id: 'aa_asdf', type: 'rel', item: 'aa' },
			aa: { id: 'aa', type: 'thread', createTime: 3 },
			bb_asdf: { id: 'bb_asdf', type: 'rel', item: 'bb' },
			bb: { id: 'bb', type: 'thread', createTime: 6 },
			cc_asdf: { id: 'cc_asdf', type: 'rel', item: 'cc' },
			cc: { id: 'cc', type: 'thread', createTime: 7 }
		});
		assert.deepEqual(cache.indexes, {
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

	it ('query', () => {
		let res = cache.query(
			'thread+(rel:item):createTime!(user:asdf)',
			[ 3, 7 ]
		);
		assert.deepEqual(res, new OrderedArray(
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

	it ('push', () => {

	});

});
