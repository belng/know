import test from 'ava';
import RangeArray from '../lib/RangeArray';
import OrderedArray from '../lib/OrderedArray';

test.beforeEach(t => {
	t.context = new OrderedArray([ 'score' ], [
		{ id: 22, score: 2 },
		{ id: 44, score: 4 },
		{ id: 77, score: 7 }
	]);
});

test('constructor', t => {
	t.deepEqual(t.context.arr, [
		{ id: 22, score: 2 },
		{ id: 44, score: 4 },
		{ id: 77, score: 7 }
	]);
});

test('indexOf between items', t => {
	t.is(t.context.indexOf(3), 1);
});

test('indexOf at first item', t => {
	t.is(t.context.indexOf(2), 0);
});

test('indexOf at middle item', t => {
	t.is(t.context.indexOf(4), 1);
});

test('indexOf at last item', t => {
	t.is(t.context.indexOf(7), 2);
});

test('indexOf before first', t => {
	t.is(t.context.indexOf(1), 0);
});

test('indexOf after last', t => {
	t.is(t.context.indexOf(9), 3);
});


test('getRange on empty range', t => {
	let range = new OrderedArray([]).getRange();
	t.deepEqual(range, new RangeArray([ [ -Infinity, Infinity ] ]));
});


test('getRange on array with one item', t => {
	let range = new OrderedArray([ 'time' ], [ { id: 'askdjnf', time: 4 } ]).getRange();
	t.deepEqual(range, new RangeArray([ [ 4, 4 ] ]));
});



test('slice with a 3 range[start, before, 0] inclusive', t => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{ id: 'askdjnf', time: 4 },
		{ id: 'askdjnfj', time: 5 },
		{ id: 'askdjnfp', time: 6 },
	]);

	t.deepEqual(
		orderedArray.slice(6, 3, 0),
		new OrderedArray([ 'time' ], [
			{ id: 'askdjnf', time: 4 },
			{ id: 'askdjnfj', time: 5 },
			{ id: 'askdjnfp', time: 6 },
		])
	);
});


test('slice with a 3 range[start, before, 0]', t => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{ id: 'askdjnf', time: 4 },
		{ id: 'askdjnfj', time: 5 },
		{ id: 'askdjnfp', time: 6 },
	]);

	t.deepEqual(
		orderedArray.slice(7, 3, 0),
		new OrderedArray([ 'time' ], [
			{ id: 'askdjnf', time: 4 },
			{ id: 'askdjnfj', time: 5 },
			{ id: 'askdjnfp', time: 6 },
		])
	);
});

test('slice with a 3 range[start, 0, after]', t => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{ id: 'askdjnf', time: 4 },
		{ id: 'askdjnfj', time: 5 },
		{ id: 'askdjnfp', time: 6 },
	]);

	t.deepEqual(
		orderedArray.slice(4, 0, 3),
		new OrderedArray([ 'time' ], [
			{ id: 'askdjnf', time: 4 },
			{ id: 'askdjnfj', time: 5 },
			{ id: 'askdjnfp', time: 6 },
		])
	);
});


test('slice with a 3 range[start, 0, after]', t => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{ id: 'askdjnf', time: 4 },
		{ id: 'askdjnfj', time: 5 },
		{ id: 'askdjnfp', time: 6 },
	]);

	t.deepEqual(
		orderedArray.slice(3, 0, 3),
		new OrderedArray([ 'time' ], [
			{ id: 'askdjnf', time: 4 },
			{ id: 'askdjnfj', time: 5 },
			{ id: 'askdjnfp', time: 6 },
		])
	);
});

test('slice with a 3 range[-Infinity, 0, after]', t => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{ id: 'askdjnf', time: 4 },
		{ id: 'askdjnfj', time: 5 },
		{ id: 'askdjnfp', time: 6 },
	]);

	t.deepEqual(
		orderedArray.slice(-Infinity, 0, 3),
		new OrderedArray([ 'time' ], [
			{ id: 'askdjnf', time: 4 },
			{ id: 'askdjnfj', time: 5 },
			{ id: 'askdjnfp', time: 6 },
		])
	);
});

test('slice with a 3 range[Infinity, before, 0] inclusive', t => {
	let orderedArray = new OrderedArray([ 'time' ], [
		{ id: 'askdjnf', time: 4 },
		{ id: 'askdjnfj', time: 5 },
		{ id: 'askdjnfp', time: 6 },
	]);

	t.deepEqual(
		orderedArray.slice(Infinity, 3, 0),
		new OrderedArray([ 'time' ], [
			{ id: 'askdjnf', time: 4 },
			{ id: 'askdjnfj', time: 5 },
			{ id: 'askdjnfp', time: 6 },
		])
	);
});
