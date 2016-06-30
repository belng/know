import test from 'ava';
import Cache from '../lib/Cache';

const {
	RangeArray,
	OrderedArray,
} = Cache;

test('-Infinity queries should be clamped', t => {
	let cache = new Cache();

	cache.onChange(change => {
		t.deepEqual(change.queries['text:createTime'],
			new RangeArray([ [ -Infinity, 0, 10 ] ])
		);
	});

	cache.query('text:createTime', [ -Infinity, 10, 10 ]);
});

test('+Infinity queries should be clamped', t => {
	let cache = new Cache();

	cache.onChange(change => {
		t.deepEqual(change.queries['text:createTime'],
			new RangeArray([ [ Infinity, 10, 0 ] ])
		);
	});

	cache.query('text:createTime', [ Infinity, 10, 10 ]);
});

test.cb('Empty results', t => {
	let cache = new Cache();

	cache.onChange(change => {
		if (change.queries) {
			cache.put({
				knowledge: { 'note:updateTime!(user:satya164)': new RangeArray(
					[ [ -Infinity, +Infinity ] ]
				) },
				indexes: { 'note:updateTime!(user:satya164)': new OrderedArray(
					[ 'updateTime' ],
					[]
				) }
			});
		}
	});

	cache.query(
		'note:updateTime!(user:satya164)',
		[ Infinity, 100, 0 ],
		(err, results) => { t.deepEqual(results.arr, []); t.end(); }
	);

});


test.cb('Query when partial results:', t => {
	const cache = new Cache({
		id: (e) => e.id
	});

	cache.onChange(() => {
		cache.query(
			'thread+(threadrel:item):createTime!(thread:(parents~Sfirst:b762fc59~Fd986~F4d4c~Faaba~F9a1d654f80c7),threadrel:(user:harish))',
			[ Infinity, 31, 0 ],
			(err, results) => {
				t.true(!err);
				t.deepEqual(results.arr, []); t.end();
			}
		);

		console.log(cache.queries['thread+(threadrel:item):createTime!(thread:(parents~Sfirst:b762fc59~Fd986~F4d4c~Faaba~F9a1d654f80c7),threadrel:(user:harish))']);

		t.deepEqual(
			cache.queries['thread+(threadrel:item):createTime!(thread:(parents~Sfirst:b762fc59~Fd986~F4d4c~Faaba~F9a1d654f80c7),threadrel:(user:harish))'],
			new RangeArray([ [ 1465564462683, 13, 0 ] ])
		);
		t.end();
	});
	cache.put({
		knowledge: {
			'thread+(threadrel:item):createTime!(thread:(parents~Sfirst:b762fc59~Fd986~F4d4c~Faaba~F9a1d654f80c7),threadrel:(user:harish))': new RangeArray([
				[ 1465564462683, Infinity ]
			])
		},

		indexes: {
			'thread+(threadrel:item):createTime!(thread:(parents~Sfirst:b762fc59~Fd986~F4d4c~Faaba~F9a1d654f80c7),threadrel:(user:harish))': new OrderedArray([
				'thread', 'createTime'
			], [
				{
					threadrel: {},
					thread: {
						id: '09241b91-5be4-4a3a-9572-c735b7df88f9',
						createTime: 1465564462683,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'e1652039-f1dd-4c41-9ec4-c9faa941c1db',
						createTime: 1465567022865,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'ad002f06-32b2-49f8-ae56-f9a21c58aeea',
						createTime: 1465567571266,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: '251537d6-cd70-41fb-8406-6b529264cc3a',
						createTime: 1465567627420,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: '2af497c2-3c79-41c3-b2f3-b40c4730df93',
						createTime: 1465818328776,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'c386abee-b308-48a2-b3c5-5fc78daf7f4b',
						createTime: 1465820300500,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'f39b7841-0d12-4158-833a-5c26c1436e75',
						createTime: 1465822988051,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'd34957c7-f7a4-49de-b061-d718defc26ee',
						createTime: 1465824100589,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: '5a0fec70-a534-4888-b680-7b36cfaf47b9',
						createTime: 1465897308400,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'e23169ae-0181-4fb5-a809-3ebaff16a3fc',
						createTime: 1466165845235,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: '004711f9-756e-4072-88af-2dfda02ef626',
						createTime: 1466239247810,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: '71a33e9f-28d2-4a11-9315-6092413a0439',
						createTime: 1466579732474,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'c64d36ce-b23f-4827-9601-20a193e98bc3',
						createTime: 1466586039589,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: '96b3f6fe-632a-41ef-b437-dd7518ee4890',
						createTime: 1466672440000,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'ea2d8d94-af04-45e1-993e-141732ce948d',
						createTime: 1466762435994,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'a1a95a2c-602d-4cd7-b205-d831b065c13b',
						createTime: 1466769646745,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
 					threadrel: {},
					thread: {
						id: '3bd7302d-7200-41ee-8996-8d4d68697c6f',
						createTime: 1466772351032,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: 'f02c67d6-a7d9-4fdf-9e76-2ed21d7754e2',
						createTime: 1466844354077,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				},
				{
					threadrel: {},
					thread: {
						id: '81700991-b817-46d9-aaac-be098f10cd84',
						createTime: 1467013552949,
						parents: [ 'b762fc59-d986-4d4c-aaba-9a1d654f80c7' ],
						type: 3
					}
				}
			])
		}
	});
});
