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
