import test from 'ava';
import State from '../lib/State';

test('should set and get data', t => {
	const state = new State();

	state.set('mydata', [ 3, 4, 5 ]);

	t.deepEqual(state.get('mydata'), [ 3, 4, 5 ], 'result doesn\'t match the current data');
});

test('should put and watch', t => {
	const state = new State();

	let sub = -1;

	state.watch('mydata', result => {
		sub++;

		switch (sub) {
		case 0:
			return t.is(result, undefined, 'result doesn\'t match the current data');
		case 1:
			return t.deepEqual(result, [ 3, 4, 5 ], 'result doesn\'t match the current data');
		}
	});

	state.put({
		mydata: [ 3, 4, 5 ]
	});
});

test('should not fire after unwatch', t => {
	const state = new State();

	let sub = -1;

	const unwatch = state.watch('mydata', result => {
		sub++;

		if (sub > 1) {
			t.fail(result, null, 'callback called after being unwatched');
		}
	});

	state.put({
		mydata: [ 3, 4, 5 ]
	});

	unwatch();
});

test('should not fire if value didn\'t change', t => {
	const state = new State();

	state.put({
		mydata: 'hello'
	});

	let sub = 0;

	state.watch('mydata', result => {
		if (sub > 0) {
			t.fail(result, null, 'callback called without value changing');
		}

		sub++;
	});

	state.put({
		mydata: 'hello'
	});
});
