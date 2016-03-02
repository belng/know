/* eslint-env mocha */

var ks = require('../lib/keyslice'),
	assert = require('assert');

it('should slice to key in', () => {
	assert.equal(ks.sliceToKey({
		type: 'text',
		join: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}), 'text+(rel:item):createTime!(thread:t1,user:u1)');
});


it('should slice to key out', () => {
	assert.equal(ks.sliceToKey({
		type: 'text',
		link: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}), 'text-(rel:item):createTime!(thread:t1,user:u1)');
});

it('should key to slice in', () => {
	assert.deepEqual({
		type: 'text',
		join: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}, ks.keyToSlice('text+(rel:item):createTime!(thread:t1,user:u1)'));
});

it('should key to slice in', () => {
	assert.deepEqual({
		type: 'text',
		link: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}, ks.keyToSlice('text-(rel:item):createTime!(thread:t1,user:u1)'));
});


it('two way conversion should result in same object', () => {
	var x = {
		type: 'thread',
		order: 'createtime',
		filter: {
			parentsCtd: [ 'abc' ]
		}
	};
	assert.deepEqual(
		x, ks.keyToSlice(ks.sliceToKey(x))
	);
});
