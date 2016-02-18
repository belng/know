/* eslint-env mocha */

let RangeArray = require('../lib/RangeArray'),
	assert = require('assert');

it('should subtract a whole range', () => {
	assert.deepEqual(
		new RangeArray([ [ 1, 4 ], [ 6, 9 ] ]).difference(new RangeArray([ [ 1, 4 ] ])),
		{ arr: [ [ 6, 9 ] ]}
	);
});

it('should subtract part of ranges', () => {
	assert.deepEqual(
		new RangeArray([ [ 1, 4 ], [ 6, 9 ] ]).difference(new RangeArray([ [ 3, 7 ] ])),
		{ arr: [ [ 1, 3 ], [ 7, 9 ] ]}
	);
});

it('should add an overlapping 3-range at the end', () => {
	let ra = new RangeArray([ [ 1, 4 ] ]);
	ra.add([ 3, 5 ]);
	assert.deepEqual(ra, { arr: [ [ 1, 5 ] ]});
});

it('should add a non-overlapping 3-range at the end', () => {
	let ra = new RangeArray([ [ 1, 4 ] ]);
	ra.add([ 5, 7 ]);
	assert.deepEqual(ra, { arr: [ [ 1, 4 ], [ 5, 7 ] ]});
});


it('should add a touching 3-range at the end', () => {
	let ra = new RangeArray([ [ 1, 4 ] ]);
	ra.add([ 4, 7 ]);
	assert.deepEqual(ra, { arr: [ [ 1, 7 ] ]});
});

it('should add an overlapping 3-range at the beginning', () => {
	let ra = new RangeArray([ [ 1, 4 ] ]);
	ra.add([ 0, 2 ]);
	assert.deepEqual(ra, { arr: [ [ 0, 4 ] ]});
});

it('should add a non-overlapping 3-range at the beginning', () => {
	let ra = new RangeArray([ [ 1, 4 ] ]);
	ra.add([ -1, 0 ]);
	assert.deepEqual(ra, { arr: [ [ -1, 0 ], [ 1, 4 ] ]});
});

it('should add a touching 3-range at the beginning', () => {
	let ra = new RangeArray([ [ 1, 4 ] ]);
	ra.add([ 0, 1 ]);
	assert.deepEqual(ra, { arr: [ [ 0, 4 ] ]});
});

it('should JSONify', () => {
	let ra = new RangeArray([ [ 1, 4 ] ]);
	console.log(JSON.stringify(ra));
});
