import test from 'ava';
import Cache from '../lib/Cache';

test.beforeEach(t => {
	t.context.cache = new Cache();
});

test('checking if the insert was successful', t => {
	const { cache } = t.context;
	const room = {
		id: 'numix',
		type: 'room',
		description: 'GTK+ and Gnome Shell themes.'
	};

	cache.put({ entities: { numix: room } });
	t.deepEqual(cache.entities, { numix: room });
	t.deepEqual(cache.getEntity('numix'), room);
});

test.cb('checking if callback of getEntity is fired if entity doesnt exist', t => {
	const { cache } = t.context;

	cache.onChange(changes => {
		if (
			changes.queries && changes.queries.entities &&
			changes.queries.entities.alice === true
		) {
			cache.put({ entities: { alice: null } });
		}
	});
	t.deepEqual(
		cache.getEntity('alice', (err, entity) => {
			t.true(!err, 'threw an error');
			t.true(!entity, 'entity doesnt exist');
			t.end();
		}),
		{ type: 'loading' }
	);
	t.deepEqual(cache.queries, { entities: { alice: true } });
});


test.cb('checking if callback of getEntity is fired if entity is added later', t => {
	const { cache } = t.context;
	let callbackFired = false;

	cache.onChange((changes) => {
		if (
			changes.queries && changes.queries.entities &&
			changes.queries.entities.alice === true
		) {
			cache.put({ entities: { alice: {
				id: 'alice',
				createTime: 140000000,
				description: 'stupid day dreamer'
			} } });
		}
	});

	cache.getEntity('alice', (err, entity) => {
		t.falsy(callbackFired, 'callback fired twice');
		callbackFired = true;
		t.falsy(err, 'threw an error');
		t.deepEqual(entity, {
			id: 'alice',
			createTime: 140000000,
			description: 'stupid day dreamer'
		});
		cache.put({ entities: { alice: null } });
		setTimeout(() => t.end(), 100);
	});
});
