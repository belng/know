import test from 'ava';
import Cache from '../lib/Cache';

const cache = new Cache();
const key = 'item+(rel:item):score';

test.skip('should handle infinities correctly', t => {
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
