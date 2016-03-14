/* eslint-env mocha */
/* eslint-disable no-undefined */

'use strict';

const State = require('../lib/State').default,
	  assert = require('assert');

describe('State', () => {
	it('should set and get data', () => {
		const state = new State();

		state.set('mydata', [ 3, 4, 5 ]);

		assert.deepEqual(state.get('mydata'), [ 3, 4, 5 ], `result doesn't match the current data`);
	});

	it('should put and watch', () => {
		const state = new State();

		let sub = -1;

		state.watch('mydata', result => {
			sub++;

			switch (sub) {
			case 0:
				return assert.equal(result, undefined, `result doesn't match the current data`);
			case 1:
				return assert.deepEqual(result, [ 3, 4, 5 ], `result doesn't match the current data`);
			}
		});

		state.put({
			mydata: [ 3, 4, 5 ]
		});
	});

	it('should not fire after unwatch', () => {
		const state = new State();

		let sub = -1;

		const unwatch = state.watch('mydata', result => {
			sub++;

			if (sub > 1) {
				assert.fail(result, null, 'callback called after being unwatched');
			}
		});

		state.put({
			mydata: [ 3, 4, 5 ]
		});

		unwatch();
	});

	it('should not fire if value didn\'t change', () => {
		const state = new State();

		state.put({
			mydata: 'hello'
		});

		let sub = 0;

		state.watch('mydata', result => {
			if (sub > 0) {
				assert.fail(result, null, 'callback called without value changing');
			}

			sub++;
		});

		state.put({
			mydata: 'hello'
		});
	});
});
