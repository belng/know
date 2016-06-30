import test from 'ava';
import RangeArray from '../lib/RangeArray';

test('should subtract a whole range', t => {
	let rangeArray = new RangeArray([
		{ start: 1, end: 4 }, { start: 6, end: 9 }
	]).difference(new RangeArray([ { start: 1, end: 4 } ]));
	t.truthy(rangeArray instanceof RangeArray);
	t.is(rangeArray.arr.length, 1, rangeArray.arr);
	t.is(rangeArray.arr[0].start, 6, 'first item start incorrect');
	t.is(rangeArray.arr[0].end, 9, 'first item end incorrect');
});

test('should subtract part of ranges', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 }, { start: 6, end: 9 } ]).difference(new RangeArray([ { start: 3, end: 7 } ]));

	t.truthy(rangeArray instanceof RangeArray);
	t.is(rangeArray.arr.length, 2, 'length incorrect');
	t.is(rangeArray.arr[0].start, 1, 'first item start incorrect');
	t.is(rangeArray.arr[0].end, 3, 'first item end incorrect');
	t.is(rangeArray.arr[1].start, 7, 'second item start incorrect');
	t.is(rangeArray.arr[1].end, 9, 'second item end incorrect');
});


test('should add an overlapping 3-range at the end', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 } ]);

	rangeArray.add({ start: 3, end: 5 });
	t.truthy(rangeArray instanceof RangeArray);
	t.is(rangeArray.arr.length, 1, 'length incorrect');
	t.is(rangeArray.arr[0].start, 1, 'first item start incorrect');
	t.is(rangeArray.arr[0].end, 5, 'first item end incorrect');
});

test('should add a non-overlapping 3-range at the end', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 } ]);

	rangeArray.add({ start: 5, end: 7 });
	t.truthy(rangeArray instanceof RangeArray);
	t.is(rangeArray.arr.length, 2, 'length incorrect');
	t.is(rangeArray.arr[0].start, 1, 'first item start incorrect');
	t.is(rangeArray.arr[0].end, 4, 'first item end incorrect');
	t.is(rangeArray.arr[1].start, 5, 'second item start incorrect');
	t.is(rangeArray.arr[1].end, 7, 'second item end incorrect');
});


test('should add a touching 3-range at the end', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 } ]);

	rangeArray.add({ start: 4, end: 7 });
	t.truthy(rangeArray instanceof RangeArray);
	t.is(rangeArray.arr.length, 1, 'length incorrect');
	t.is(rangeArray.arr[0].start, 1, 'second item start incorrect');
	t.is(rangeArray.arr[0].end, 7, 'second item end incorrect');
});

test('should add an overlapping 3-range at the beginning', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 } ]);

	rangeArray.add({ start: 0, end: 2 });
	t.truthy(rangeArray instanceof RangeArray);
	t.is(rangeArray.arr.length, 1, 'length incorrect');
	t.is(rangeArray.arr[0].start, 0, 'first item start incorrect');
	t.is(rangeArray.arr[0].end, 4, 'first item end incorrect');
});

test('should subtract exact ranges to nothing', t => {
	t.deepEqual(
		new RangeArray([ [ 1, 3 ] ])
		.difference(new RangeArray([ [ 1, 3 ] ])),
		new RangeArray([])
	);
});

test('should add a non-overlapping 2-range at the beginning', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 } ]);
	rangeArray.add({ start: -1, end: 0 });

	t.deepEqual(rangeArray, new RangeArray([
		{ start: -1, end: 0 },
		{ start: 1, end: 4 }
	]));
});

test('should add a touching 2-range at the beginning', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 } ]);

	rangeArray.add({ start: 0, end: 1 });
	t.truthy(rangeArray instanceof RangeArray);
	t.is(rangeArray.arr.length, 1, 'length incorrect');
	t.is(rangeArray.arr[0].start, 0, 'first item start incorrect');
	t.is(rangeArray.arr[0].end, 4, 'first item end incorrect');
});

test('should JSONify', t => {
	let rangeArray = new RangeArray([ { start: 1, end: 4 } ]);
	t.truthy(JSON.stringify(rangeArray), 'hooray!!!');
});

test('should intersect overlapping', t => {
	let res = new RangeArray([ [ 1, 3 ], [ 5, 7 ] ])
		.intersect(new RangeArray([ [ 2, 6 ] ]));

	t.deepEqual(res.arr, [ [ 2, 3 ], [ 5, 6 ] ]);
});

test('should intersect to nothing', t => {
	t.deepEqual(
		new RangeArray([ [ 1, 3 ] ])
		.intersect(new RangeArray([ [ 4, 5 ] ])).arr,
		[]
	);
});

test('should intersect touching', t => {
	t.deepEqual(
		new RangeArray([ [ 1, 3 ] ])
		.intersect(new RangeArray([ [ 0, 1 ], [ 3, 5 ] ])).arr,
		[ [ 1, 1 ], [ 3, 3 ] ]
	);
});


test('should subtract full range from 3-range', t => {
	t.deepEqual(
		new RangeArray([ [ Infinity, 100, 0 ] ])
		.difference(new RangeArray([ [ -Infinity, Infinity ] ])),
		new RangeArray([])
	);
});


test('should subtract 3-range from full range', t => {
	t.deepEqual(
		new RangeArray([ [ -Infinity, Infinity ] ])
		.difference(new RangeArray([ [ Infinity, 100, 0 ] ])),
		new RangeArray([ [ -Infinity, Infinity ] ])
	);
});


test('intersect with itself should give the same', t => {
	t.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.intersect(new RangeArray([ [ -Infinity, Infinity ] ])),
		new RangeArray([ [ -Infinity, Infinity ] ])
	);
});


test('difference with complete knowledge with 2-range query', t => {
	t.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.difference(new RangeArray([ [ -Infinity, +Infinity ] ])),
		new RangeArray([ ])
	);
});

test('difference with complete knowledge with 3-range query', t => {
	t.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.difference(new RangeArray([ [ Infinity, 100, 0 ] ])),
		new RangeArray([ [ -Infinity, +Infinity ] ])
	);
});


test('difference with complete knowledge with empty', t => {
	t.deepEqual(
		new RangeArray([ [ -Infinity, +Infinity ] ])
		.difference(new RangeArray([ ])),
		new RangeArray([ [ -Infinity, +Infinity ] ])
	);
});


test('intersection full range with point range', t => {
	t.deepEqual(
		new RangeArray([ [ -Infinity, Infinity ] ])
		.intersect(new RangeArray([ [ 25, 25 ] ])),
		new RangeArray([ [ 25, 25 ] ])
	);
});


test('intersection point range with full range', t => {
	t.deepEqual(
		new RangeArray([ [ 25, 25 ] ])
		.intersect(new RangeArray([ [ -Infinity, Infinity ] ])),
		new RangeArray([ [ 25, 25 ] ])
	);
});

test('intersection finite range with point range at end', t => {
	t.deepEqual(
		new RangeArray([ [ 15, 25 ] ])
		.intersect(new RangeArray([ [ 25, 25 ] ])),
		new RangeArray([ [ 25, 25 ] ])
	);
});

test('intersection point with point', t => {
	t.deepEqual(
		new RangeArray([ [ 25, 25 ] ])
		.intersect(new RangeArray([ [ 25, 25 ] ])),
		new RangeArray([ [ 25, 25 ] ])
	);
});


test('intersection with half Infinity range:', t => {
	t.deepEqual(
		new RangeArray([ [ 25, Infinity ] ])
		.intersect(new RangeArray([ [ -Infinity, +Infinity ] ])),
		new RangeArray([ [ 25, Infinity ] ])
	);
});

test('difference of full with full', t => {
	t.deepEqual(
		new RangeArray([ [ Infinity, Infinity ] ])
		.difference(new RangeArray([ [ -Infinity, Infinity ] ])),
		new RangeArray()
	);
});

test('difference between 2 range and empty', t => {
	t.deepEqual(
		new RangeArray([ [ 5, 10 ] ]).difference(new RangeArray([])),
		new RangeArray([ [ 5, 10 ] ])
	);
});

test('difference between empty range and 2 range', t => {
	t.deepEqual(
		new RangeArray([]).difference(new RangeArray([ [ 5, 10 ] ])),
		new RangeArray([])
	);
});


test('difference between empty range and 3 range', t => {
	t.deepEqual(
		new RangeArray([]).difference(new RangeArray([ [ 5, 1, 0 ] ])),
		new RangeArray([])
	);
});
