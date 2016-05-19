import util from 'util';
import test from 'ava';
import Cache from '../lib/Cache';

const {
	RangeArray,
	OrderedArray,
} = Cache;

test.cb('should fire one onchange', t => {
	let cache = new Cache({});

	cache.onChange(changes => {
		t.deepEqual(changes, {
			entities: {
				foo: { id: 'foo', type: 'boo' },
				bar: { id: 'bar', type: 'boo' }
			}
		});
		t.end();
	});

	cache.put({ entities: { foo: { id: 'foo', type: 'boo' } } });
	cache.put({ entities: { bar: { id: 'bar', type: 'boo' } } });
});


test.cb('should aggregate change and fire onchange one', t => {
	let cache = new Cache({}), count = 0;

	cache.onChange(changes => {
		count++;
		if (count === 1) {
			t.deepEqual(changes, {
				entities: {
					foo: { id: 'foo', type: 'boo' },
					bar: { id: 'bar', type: 'boo' }
				},
				source: 'server'
			});
			t.end();
		}

		if (count === 2) {
			throw new Error("Onchange fired multiple times");
		}
	});

	cache.put({ entities: { foo: { id: 'foo', type: 'boo' } }, source: 'server' });
	cache.put({ entities: { bar: { id: 'bar', type: 'boo' } }, source: 'server' });
});


test.cb('should not aggregate change and fire onchange twice', t => {
	let cache = new Cache({}), count = 0;

	cache.onChange(() => {
		count++;

		if (count === 2) {
			t.end();
		}

	});

	cache.put({ entities: { foo: { id: 'foo', type: 'boo' } }, source: 'server' });
	cache.put({ entities: { bar: { id: 'bar', type: 'boo' } } });
});



test.cb('should fire onchange twice', t => {
	let cache = new Cache({}), count = 0;

	cache.onChange(changes => {
		count++;

		if (count === 1) {
			t.deepEqual(changes, {
				entities: {
					foo: { id: 'foo', type: 'boo' }
				},
				source: 'server'
			});
		}

		if (count === 2) {
			t.deepEqual(changes, {
				entities: {
					bar: { id: 'bar', type: 'boo' }
				}
			});
			t.end();
		}
	});

	cache.put({ entities: { foo: { id: 'foo', type: 'boo' } }, source: 'server' });
	Promise.resolve().then(function() {
		cache.put({ entities: { bar: { id: 'bar', type: 'boo' } } });
	});
});
