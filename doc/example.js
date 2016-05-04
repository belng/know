/*
	Example: usage of cache in pure server-side store.
*/

let Cache = require('cache'),
	constants = require('lib/constants'),
	typeMap = {
		[constants.TYPE_ROOM]: { room: true, item: true },
		[constants.TYPE_TEXT]: { text: true, item: true },
		[constants.TYPE_USER]: { user: true }
	},
	cache = new Cache({
		is (entity, type) {
			if (entity.type) {
				return !!typeMap[entity.type][type];
			} else {
				return type === 'relation';
			}
		},
		id (entity) {
			if (entity.id) {
				return entity.id;
			} else {
				return entity.room + ':' + entity.user;
			}
		}
	});



cache.put(localStorage.loadState());
cache.onChange(changes => core.emit(changes));

// tests -------------------------------------------

cache.put({
	entities: {
		test: {
			id: 'test',
			type: 'room',
			createTime: 1
		}
	}
});

assert(cache.entities.test.id == 'test');
