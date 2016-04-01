/* eslint-env mocha */
'use strict';

	let OrderedArray = require('../lib/OrderedArray'),
	RangeArray =  require('../lib/RangeArray'),
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


it('getRange on empty range', () => {
	let range = new OrderedArray([]).getRange();
	assert.deepEqual(range, new RangeArray([ [ -Infinity, Infinity ] ]));
});


it('getRange on array with one item', () => {
	let range = new OrderedArray([ 'time' ], [ {id: 'askdjnf', time: 4} ]).getRange();
	assert.deepEqual(range, new RangeArray([ [ 4, 4 ] ]));
});



it.only('slice with a 3 range[start, before, 0] inclusive', () => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{id: 'askdjnf', time: 4},
		{id: 'askdjnfj', time: 5},
		{id: 'askdjnfp', time: 6},
	]);

	assert.deepEqual(
		orderedArray.slice(6, 3, 0),
		new OrderedArray(['time'], [
			{id: 'askdjnf', time: 4},
			{id: 'askdjnfj', time: 5},
			{id: 'askdjnfp', time: 6},
		])
	);
});


it.only('slice with a 3 range[start, before, 0]', () => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{id: 'askdjnf', time: 4},
		{id: 'askdjnfj', time: 5},
		{id: 'askdjnfp', time: 6},
	]);

	assert.deepEqual(
		orderedArray.slice(7, 3, 0),
		new OrderedArray(['time'], [
			{id: 'askdjnf', time: 4},
			{id: 'askdjnfj', time: 5},
			{id: 'askdjnfp', time: 6},
		])
	);
});

it('slice with a 3 range[start, 0, after]', () => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{id: 'askdjnf', time: 4},
		{id: 'askdjnfj', time: 5},
		{id: 'askdjnfp', time: 6},
	]);

	assert.deepEqual(
		orderedArray.slice(4, 0, 3),
		new OrderedArray(['time'], [
			{id: 'askdjnf', time: 4},
			{id: 'askdjnfj', time: 5},
			{id: 'askdjnfp', time: 6},
		])
	);
});


it('slice with a 3 range[start, 0, after]', () => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{id: 'askdjnf', time: 4},
		{id: 'askdjnfj', time: 5},
		{id: 'askdjnfp', time: 6},
	]);

	assert.deepEqual(
		orderedArray.slice(3, 0, 3),
		new OrderedArray(['time'], [
			{id: 'askdjnf', time: 4},
			{id: 'askdjnfj', time: 5},
			{id: 'askdjnfp', time: 6},
		])
	);
});
