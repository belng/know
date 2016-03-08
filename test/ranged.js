"use strict";

/* eslint-env mocha */

let RangeArray = require('../lib/RangeArray'),
	assert = require('assert');

it('should subtract a whole range', () => {
	let rangeArray = new RangeArray([
		{start: 1, end: 4}, {start: 6, end: 9}
	]).difference(new RangeArray([ {start: 1, end: 4} ]));
	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length, 1, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, 6, 'first item start incorrect');
	assert.equal(rangeArray.arr[0].end, 9, 'first item end incorrect');
});

it('should subtract part of ranges', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4}, {start: 6, end: 9} ]).difference(new RangeArray([ {start: 3, end: 7 } ]));

	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length, 2, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, 1, 'first item start incorrect');
	assert.equal(rangeArray.arr[0].end, 3, 'first item end incorrect');
	assert.equal(rangeArray.arr[1].start, 7, 'second item start incorrect');
	assert.equal(rangeArray.arr[1].end, 9, 'second item end incorrect');
});


it('should add an overlapping 3-range at the end', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4} ]);

	rangeArray.add({start: 3, end: 5});
	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length, 1, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, 1, 'first item start incorrect');
	assert.equal(rangeArray.arr[0].end, 5, 'first item end incorrect');
});

it('should add a non-overlapping 3-range at the end', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4} ]);

	rangeArray.add({start: 5, end: 7});
	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length, 2, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, 1, 'first item start incorrect');
	assert.equal(rangeArray.arr[0].end, 4, 'first item end incorrect');
	assert.equal(rangeArray.arr[1].start, 5, 'second item start incorrect');
	assert.equal(rangeArray.arr[1].end, 7, 'second item end incorrect');
});


it('should add a touching 3-range at the end', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4} ]);

	rangeArray.add({start: 4, end: 7});
	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length, 1, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, 1, 'second item start incorrect');
	assert.equal(rangeArray.arr[0].end, 7, 'second item end incorrect');
});

it('should add an overlapping 3-range at the beginning', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4} ]);

	rangeArray.add({start: 0, end: 2});
	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length,   1, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, 0, 'first item start incorrect');
	assert.equal(rangeArray.arr[0].end,   4, 'first item end incorrect');
});

it('should subtract exact ranges to nothing', () => {
	assert.deepEqual(
		new RangeArray([ [ 1, 3 ] ])
		.difference(new RangeArray([ [ 1, 3 ] ])),
		new RangeArray([])
	);
});

it('should add a non-overlapping 3-range at the beginning', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4} ]);

	rangeArray.add({start: -1, end: 0});
	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length, 2, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, -1, 'first item start incorrect');
	assert.equal(rangeArray.arr[0].end, 0, 'first item end incorrect');
	assert.equal(rangeArray.arr[1].start, 1, 'second item start incorrect');
	assert.equal(rangeArray.arr[1].end, 4, 'second item end incorrect');
});

it('should add a non-overlapping 3-range at the beginning', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4} ]);

	rangeArray.add({start: 0, end: 1});
	assert(rangeArray instanceof RangeArray);
	assert.equal(rangeArray.arr.length, 1, 'length incorrect');
	assert.equal(rangeArray.arr[0].start, 0, 'first item start incorrect');
	assert.equal(rangeArray.arr[0].end, 4, 'first item end incorrect');
});

it('should JSONify', () => {
	let rangeArray = new RangeArray([ {start: 1, end: 4} ]);
	assert(JSON.stringify(rangeArray), 'hooray!!!');
});

it('should intersect overlapping', () => {
	let res = new RangeArray([ [1, 3], [5, 7] ])
		.intersect(new RangeArray([ [2, 6] ]));

	assert.deepEqual(res.arr, [ [2, 3], [5, 6] ]);
});

it('should intersect to nothing', () => {
	assert.deepEqual(
		new RangeArray([ [1, 3] ])
		.intersect(new RangeArray([ [4, 5] ])).arr,
		[]
	);
});

it('should intersect touching', () => {
	assert.deepEqual(
		new RangeArray([ [1, 3] ])
		.intersect(new RangeArray([ [0, 1], [3, 5] ])).arr,
		[]
	);
});


it ('should subtract full range from 3-range', () => {
	assert.deepEqual(
		new RangeArray([ [Infinity, 100, 0]])
		.difference(new RangeArray([ [ -Infinity, Infinity ] ])),
		new RangeArray([])
	);
});


it('should subtract 3-range from full range', () => {
	assert.deepEqual(
		new RangeArray([ [ -Infinity, Infinity ] ])
		.difference(new RangeArray([ [ Infinity, 100, 0 ] ])),
		new RangeArray([ [ -Infinity, Infinity ] ])
	);
});


it('intersect with itself should give the same', () => {
	assert.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.intersect(new RangeArray([ [ -Infinity, Infinity ] ])),
		new RangeArray([ [ -Infinity, Infinity ] ])
	);
});


it('difference with complete knowledge with 2-range query', () => {
	assert.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.difference(new RangeArray([ [ -Infinity, +Infinity ] ])),
		new RangeArray([ ])
	);
});

it('difference with complete knowledge with 3-range query', () => {
	assert.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.difference(new RangeArray([ [ Infinity, 100, 0 ] ])),
		new RangeArray([ [ -Infinity, +Infinity ] ])
	);
});


it('difference with complete knowledge with empty', () => {
	assert.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.difference(new RangeArray([ ])),
		new RangeArray([ [ -Infinity, +Infinity ] ])
	);
});
