/* eslint-env mocha */
/* eslint-disable no-undefined */

'use strict';

const State = require('../lib/State'),
	  assert = require('assert');

describe('State', () => {
	it('should put, watch and get data', () => {
		const state = new State({
			op: {}
		});

		let sub1 = -1,
			sub2 = -1;

		const unwatch1 = state.watch([ 'something' ], result => {
			sub1++;

			switch (sub1) {
			case 0:
				return assert.equal(result, undefined, `result doesn't match the current data`);
			case 1:
				return assert.equal(result, 'test-1', `result doesn't match the current data`);
			case 2:
				return assert.fail(result, null, 'callback called after being unwatched');
			}
		});

		state.put({
			something: 'test-1'
		});

		const unwatch2 = state.watch([ 'something' ], result => {
			sub2++;

			switch (sub2) {
			case 0:
				return assert.equal(result, 'test-1', `result doesn't match the current data`);
			case 1:
				return assert.fail(result, null, 'callback called after being unwatched');
			}
		});

		assert.equal(state.get([ 'something' ]), 'test-1', `result doesn't match the current data`);

		unwatch1();
		unwatch2();

		state.put({
			something: 'test-2'
		});

		assert.equal(state.get([ 'something' ]), 'test-2', `result doesn't match the current data`);
	});
});
