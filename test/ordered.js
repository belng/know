/* eslint-env mocha */
'use strict';

let OrderedArray = require('../lib/OrderedArray'),
	assert = require('assert'),
	arr;

beforeEach(() => {
	arr = new OrderedArray([ 'score' ], [
		{ id: 22, score: 2 },
		{ id: 44, score: 4 },
		{ id: 77, score: 7 }
	]);
});

it('constructor', () => {
	assert.deepEqual(arr.arr, [
		{ id: 22, score: 2 },
		{ id: 44, score: 4 },
		{ id: 77, score: 7 }
	]);
});

it('indexOf between items', () => {
	assert.equal(arr.indexOf(3), 1);
});

it('indexOf at first item', () => {
	assert.equal(arr.indexOf(2), 0);
});

it('indexOf at middle item', () => {
	assert.equal(arr.indexOf(4), 1);
});

it('indexOf at last item', () => {
	assert.equal(arr.indexOf(7), 2);
});

it('indexOf before first', () => {
	assert.equal(arr.indexOf(1), 0);
});

it('indexOf after last', () => {
	assert.equal(arr.indexOf(9), 3);
});
