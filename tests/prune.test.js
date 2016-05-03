import test from 'ava';
import Cache from '../lib/Cache';

test.skip('Should trigger a prune due to getEntities', () => {
	const cache = new Cache({
		maxEntities: 10
	});

	for (let i = 0; i < 15; i++) {
		cache.put({ entities: {
			['test' + i]: { id: 'test' + i, name: 'Foo' }
		} });

		cache.getEntities();
	}
});
