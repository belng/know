import test from 'ava';
import * as ks from '../lib/keyslice';

test('should slice to key in', t => {
	t.is(ks.sliceToKey({
		type: 'text',
		join: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}), 'text+(rel:item):createTime!(thread:t1,user:u1)');
});


test('should slice to key out', t => {
	t.is(ks.sliceToKey({
		type: 'text',
		link: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}), 'text-(rel:item):createTime!(thread:t1,user:u1)');
});

test('should key to slice in', t => {
	t.deepEqual({
		type: 'text',
		join: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}, ks.keyToSlice('text+(rel:item):createTime!(thread:t1,user:u1)'));
});

test('should key to slice in', t => {
	t.deepEqual({
		type: 'text',
		link: { rel: 'item' },
		filter: { thread: 't1', user: 'u1' },
		order: 'createTime'
	}, ks.keyToSlice('text-(rel:item):createTime!(thread:t1,user:u1)'));
});


test('two way conversion should result in same object', t => {
	var x = {
		type: 'thread',
		order: 'createtime',
		filter: {
			parentsCtd: [ 'abc' ]
		}
	};
	t.deepEqual(
		x, ks.keyToSlice(ks.sliceToKey(x))
	);
});
