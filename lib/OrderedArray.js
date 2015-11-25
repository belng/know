"use strict";
let RangeArray = require("./RangeArray");

module.exports = class OrderedArray {
	constructor(order, objects) {
		if (!Array.isArray(objects)) {
			objects = [];
		}

		this.arr = objects;
		this[Symbol.iterator] = objects[Symbol.iterator].bind(objects);
		Object.defineProperty(this, "order", { value: order });
		Object.defineProperty(this, "length", { get: () => objects.length });
	}

	/*
		Finds the index of a particular value.
		@param value - What to find
		@param [start=0] - Index position to start at
		@param [end=length] - Index position to end
	*/
	indexOf(value) {
		let pos, start = 0, end = this.arr.length;
		while (start < end) {
			pos = ((start + end) / 2) | 0;
			if (this.arr[pos] && this.arr[pos][this.order] < value) {
				start = pos + 1;
			} else if (this.arr[pos - 1] && this.arr[pos - 1][this.order] >= value) {
				end = pos - 1;
			} else {
				start = pos;
				break;
			}
		}
		// while (this.arr[start][this.order] === value) start--;
		return start;
	}

	put(object) {
		let val = object[this.order],
			pos = this.indexOf(val);

		if (this.arr[pos] && this.arr[pos][this.order] === val) {
			this.arr[pos] = object;
		} else {
			this.arr.splice(pos, 0, object);
		}
	}

	delete(value) {
		let pos = this.indexOf(value);

		if (this.arr[pos][this.order] === value) {
			this.arr.splice(pos, 1);
		}
	}

	slice(startValue, before, after) {
		let startPos = this.indexOf(startValue),
			endPos;

		if (arguments.length === 2) {
			endPos = this.indexOf(before); // before is actually endValue
			return new OrderedArray(this.order, this.arr.slice(startPos, endPos));
		} else if (arguments.length === 3) {
			return new OrderedArray(this.order, this.arr.slice(
				Math.max(0, startPos - before),
				Math.min(this.arr.length, startPos + after)
			));
		}
	}

	splice(startValue, endValue, objects) {
		let startIndex = this.indexOf(startValue),
			endIndex = this.indexOf(endValue);

		if (Array.isArray(objects)) {
			return new OrderedArray(this.order, this.arr.splice(
				startIndex, endIndex - startIndex, ...objects
			));
		} else {
			return new OrderedArray(this.order, this.arr.splice(
				startIndex, endIndex - startIndex
			));
		}
	}

	getRange() {
		return new RangeArray([ [
			this.arr[0][this.order], this.arr[this.arr.length - 1][this.order]
		] ]);
	}

	toJSON() {
		return this.arr;
	}
};
