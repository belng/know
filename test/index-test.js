'use strict';

/* eslint-env mocha */
var Index = require('../index.js'),
	assert = require('assert');

describe('index creation test', function () {
	it('test for findInsertPosition function: ', function () {
		let index = new Index(),
			toInsert = {
				type: 'room',
				id: 'ksadjnfkaj',
				time: 1
			},
			result = index.findInsertPosition(toInsert);

		index.setQuery({
			type: 'text',
			order: 'time',
			filter: {
				to: 'scrollback'
			},
			range: {
			}
		});

		assert.equal(result.position, 0, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');
		index.push(toInsert);

		result = index.findInsertPosition({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 0
		});

		assert.equal(result.position, 0, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');


		result = index.findInsertPosition({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 1
		});

		assert.equal(result.position, 0, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');


		index.push({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 2
		});
		index.push({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 4
		});
		index.push({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 9
		});
		index.push({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 18
		});
		index.push({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 27
		});

		index.push({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 76
		});

		index.push({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 98
		});

		toInsert = {
			type: 'room',
			id: 'ksadjnfkaj',
			time: 0
		};

		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 0, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');

		toInsert.time = 1;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 0, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');


		toInsert.time = 2;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 1, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');

		toInsert.time = 3;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 2, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');

		toInsert.time = 4;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 2, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');

		toInsert.time = 5;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 3, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');

		toInsert.time = 8;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 3, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');

		toInsert.time = 9;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 3, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');

		toInsert.time = 17;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 4, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');

		toInsert.time = 18;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 4, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');

		toInsert.time = 19;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 5, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');

		toInsert.time = 27;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 5, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');

		toInsert.time = 75;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 6, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');

		toInsert.time = 76;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 6, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');

		toInsert.time = 98;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 7, 'incorrect position');
		assert.equal(result.replace, true, 'incorrect position');

		toInsert.time = 100;
		result = index.findInsertPosition(toInsert);
		assert.equal(result.position, 8, 'incorrect position');
		assert.equal(result.replace, false, 'incorrect position');
	});

	it('test for add function: ', function () {
		let index = new Index(), length;
		index.setQuery({
			type: 'text',
			order: 'time',
			filter: {
				to: 'scrollback'
			},
			range: {
			}
		});
		var toInsert = {
			type: 'room',
			id: 'ksadjnfkaj',
			time: 1
		};

		length = index.add(toInsert);
		assert.equal(length, 1, 'incorrect position');
		assert.equal(index.get(0).time, 1, 'Insert error');


		length = index.add({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 4
		});
		assert.equal(length, 2, 'incorrect position');
		assert.equal(index.get(1).time, 4, 'Insert error');

		length = index.add({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 9
		});
		assert.equal(length, 3, 'incorrect position');
		assert.equal(index.get(1).time, 4, 'Insert error');
		assert.equal(index.get(2).time, 9, 'Insert error');

		length = index.add({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 2
		});
		assert.equal(length, 4, 'incorrect position');
		assert.equal(index.get(0).time, 1, 'Insert error');
		assert.equal(index.get(1).time, 2, 'Insert error');
		assert.equal(index.get(2).time, 4, 'Insert error');
		assert.equal(index.get(3).time, 9, 'Insert error');

		length = index.add({
			type: 'room',
			id: 'ksadjnfkaj',
			time: 98
		});

		assert.equal(length, 5, 'incorrect position');
		assert.equal(index.get(0).time, 1, 'Insert error');
		assert.equal(index.get(1).time, 2, 'Insert error');
		assert.equal(index.get(2).time, 4, 'Insert error');
		assert.equal(index.get(3).time, 9, 'Insert error');
		assert.equal(index.get(4).time, 98, 'Insert error');
	});
});
