/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let Cache = require('../lib/Cache'),
	assert = require('assert');

it('Should trigger a prune due to getEntities', () => {
	let cache = new Cache({
		maxEntities: 10
	});

	for (let i = 0; i < 15; i++) {
		cache.put({ entities: {
			['test' + i]: { id: 'test' + i, name: 'Foo' }
		}});

		cache.getEntities();
	}
});
