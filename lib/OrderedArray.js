'use strict';

let RangeArray = require('./RangeArray');

module.exports = class OrderedArray {
	constructor(order, objects) {
		if (!Array.isArray(objects)) {
			objects = [];
		}

		if (!Array.isArray(order)) {
			order = [ order ];
		}

		this.arr = objects;
		this[Symbol.iterator] = objects[Symbol.iterator].bind(objects);
		Object.defineProperty(this, 'order', { value: order });
		Object.defineProperty(this, 'length', { get: () => objects.length });
	}

	/*
		Finds the index of a particular value.
		@param value - What to find
		@param [start=0] - Index position to start at
		@param [end=length] - Index position to end
	*/
	indexOf(value, last) {
		let pos, start = 0, end = this.arr.length;
		while (start < end) {
			pos = ((start + end) / 2) | 0;
			if (this.arr[pos] && this.valAt(pos) < value) {
				start = pos + 1;
			} else if (this.arr[pos - 1] && this.valAt(pos - 1) >= value) {
				end = pos - 1;
			} else {
				start = pos;
				break;
			}
		}
		if (this.arr[start] && this.valAt(start) === value) {
			let step = last ? 1 : -1;
			while (
				this.arr[start + step] &&
				this.valAt(start + step) === value
			) { start += step; }
		}
		return start;
	}

	valOf(item) {
		let i = 0;

		while (
			typeof item === 'object' && item !== null && i < this.order.length
		) {
			item = item[this.order[i++]];
		}

		return item;
	}

	valAt(index) {
		return this.valOf(this.arr[index]);
	}

	get(index) {
		if (typeof index !== 'number') return this.arr;
		else return this.arr[index];
	}

	add(object) {
		let val = this.valOf(object),
			pos = this.indexOf(val);

		if (this.arr[pos] && this.valAt(pos) === val) {
			this.arr[pos] = object;
		} else {
			this.arr.splice(pos, 0, object);
		}
	}

	put(object, last) { // last: if multiple entries have the same value, put at end.
		let pos = this.indexOf(this.valOf(object), last);
		this.arr.splice(pos, 0, object);
	}

	delete(value) {
		let pos = this.indexOf(value);

		if (this.valAt(pos) === value) {
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
			this.valAt(0), this.valAt(this.arr.length - 1)
		] ]);
	}

	toJSON() {
		return this.arr;
	}
};
