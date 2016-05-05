import test from 'ava';
import Cache from '../lib/Cache';

const {
	RangeArray
} = Cache;

test('Forget a range', t => {
	const cache = new Cache({
		is: (entity, type) => { return type === 'relation'; }
	});

	cache.put({
		entities: {
			harish_numix: { id: 'harish_numix', roleTime: 1 },
			aravind_numix: { id: 'aravind_numix', roleTime: 3 },
			satya_numix: { id: 'satya_numix', roleTime: 6 }
		}
	});
	cache.put({
		knowledge: {
			'relation:roleTime!(:)': new RangeArray([ [ 0, +Infinity ] ])
		}
	});

	console.log("----------------------------------------");
	console.log("last change");
	console.log("----------------------------------------");
	cache.put({
		'-knowledge': {
			'relation:roleTime!(:)': new RangeArray([ [ 1000000, +Infinity ] ])
		}
	});

	console.log(cache.knowledge['relation:roleTime!(:)']);
	t.deepEqual(
		cache.knowledge['relation:roleTime!(:)'],
		new RangeArray([ [ 0, 1000000 ] ])
	);
});
