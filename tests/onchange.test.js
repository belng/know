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
	cache.put({ entities: { bar: { id: 'bar', type: 'boo' } } });
});
