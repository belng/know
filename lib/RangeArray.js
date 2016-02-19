'use strict';

/*
	The RangeArray class represents an array of ranges.
	Each range is represented by a JS array with two or three elements.

	A range with two elements represents (start, end), while a range with
	three represents (start, before, after). Start or end can also have
	boolean values false to represent -Infinity and true to represent
	+Infinity, for JSON compatibility.
*/

class Stepper {
	constructor(rangeArray) {
		this.arr = rangeArray.arr;
		this.pos = 0;
		this.inRange = false;
	}

	next() {
		if (this.pos >= this.arr.length) return Infinity;
		return this.arr[this.pos][this.inRange ? 1 : 0];
	}

	step() {
		if (this.inRange) { do {
			this.pos++;
		} while (this.arr[this.pos] && this.arr[this.pos].length !== 2); }
		this.inRange = !this.inRange;
	}
}

class Range {
	constructor(args) {

		if (args instanceof Array) {
			this.start = args[0];
			if (args.length === 2) {
				this.end = args[1];
			} else {
				this.before = args[1];
				this.after = args[2];
			}
		} else {
			this.start = args.start;
			if ('end' in args) this.end = args.end;
			if ('before' in args) this.before = args.before;
			if ('after' in args) this.after = args.after;
		}

		Object.defineProperty(this, '0', {
			get: () => this.start,
			set: (value) => this.start = value
		});

		Object.defineProperty(this, '1', {
			get: () => ('end' in this) ? this.end : this.before,
			set: (value) => this[this.length === 3 ? 'before' : 'end'] = value
		});

		Object.defineProperty(this, '2', {
			get: () => this.after,
			set: (value) => this.after = value
		});

		Object.defineProperty(this, 'length', { get: () => ('end' in this) ? 2 : 3 });
	}
}

function diff (a, b) {
	let res = [];

	function pushR(value) {
		if (res.length === 0 || res[res.length - 1].length === 2) {
			res.push([ value ]);
		} else {
			res[res.length - 1].push(value);
		}
	}

	function step() {
		let na = a.next(),
			nb = b.next();

		if (na < nb || na === nb && a.inRange) {
			if (!b.inRange) pushR(na);
			a.step();
		} else {
			if (a.inRange) pushR(nb);
			b.step();
		}
	}

	while (a.pos < a.arr.length) step();
	return res;
}

class RangeArray {
	constructor(ranges) {
		if (!Array.isArray(ranges)) {
			ranges = [];
		}

		if (ranges instanceof RangeArray) {
			ranges = ranges.arr;
		}
		this.arr = ranges.map(range => new Range(range));
		this[Symbol.iterator] = ranges[Symbol.iterator].bind(ranges);
		Object.defineProperty(this, 'length', { get: () => this.arr.length });
	}

	/*
		Finds the index of the range containing a particular value.
		@param value - What to find
		@param [start=0] - Index position to start at
		@param [end=length] - Index position to end
	*/
	indexOf(value) {
		let pos, start = 0, end = this.arr.length;
		// console.log(this.arr, value);
		while (start < end) {
			pos = ((start + end) / 2) | 0;
			if (
				this.arr[pos] &&
				(this.arr[pos].length === 2 ? this.arr[pos][1] : this.arr[pos][0]) < value
			) {
				start = pos + 1;
			} else if (this.arr[pos - 1] && this.arr[pos - 1][0] >= value) {
				end = pos - 1;
			} else {
				start = pos;
				break;
			}
		}
		while (this.arr[start - 1] && this.arr[start - 1][0] === value) start--;
		return start;
	}

	contains (value) {
		let range = this.arr[this.indexOf(value)];
		if (range && (
			range[0] === value ||
			range.length === 2 && range[0] <= value && range[1] >= value
		)) {
			return true;
		}
		return false;
	}

	difference(ranges) {
		return new RangeArray(diff(new Stepper(this), new Stepper(ranges)));
	}

	subtract(ranges) {
		return new RangeArray(diff(new Stepper(this), new Stepper(ranges)));
	}

	add(a) {
		let range = new Range(a), startPos = this.indexOf(range[0]), endPos;
		if (range.length === 3) {
			if (
				!this.arr[startPos] ||
				this.arr[startPos][0] !== range[0] ||
				this.arr[startPos].length !== range.length
			) {
				this.arr.splice(startPos, 0, range);
				return;
			}
			this.arr[startPos][1] = Math.max(this.arr.startPos[1], range[1]);
			this.arr[startPos][2] = Math.max(this.arr.startPos[2], range[2]);
		} else {
			endPos = this.indexOf(range[1]);

			if (this.arr[startPos] && this.arr[startPos][0] < range[0]) {
				range[0] = this.arr[startPos][0];
			}
			if (this.arr[endPos] && this.arr[endPos][0] <= range[1]) {
				range[1] = this.arr[endPos][1];
				endPos++;
			}
			this.arr.splice(startPos, endPos - startPos, range);
		}
	}

	put(r) {
		let range = new Range(r), startPos = this.indexOf(range[0]);
		this.arr.splice(startPos, 0, range);
	}

	toJSON() {
		return this.arr;
	}

	get(index) {
		if (typeof index !== 'number') return this.arr;
		else return this.arr[index];
	}

	hasStart() {
		return this.arr[0][0] === -Infinity;
	}

	hasEnd() {
		return this.arr[this.arr.length - 1][1] === Infinity;
	}
}

module.exports = RangeArray;
