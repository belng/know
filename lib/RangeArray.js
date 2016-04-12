/*
	The RangeArray class represents an array of ranges.
	Each range is represented by a JS array with two or three elements.

	A range with two elements represents (start, end), while a range with
	three represents (start, before, after). Start or end can also have
	boolean values false to represent -Infinity and true to represent
	+Infinity, for JSON compatibility.
*/

// TODO: Detect invalid input that might cause union/intersect/difference to
// go into infinite loop.

class Stepper {
	constructor(rangeArray) {
		this.arr = rangeArray.arr.filter(range => range.length === 2);
		this.pos = 0;
		this.inRange = false;
	}

	next() {
		if (this.pos >= this.arr.length) return Infinity;
		return this.arr[this.pos][this.inRange ? 1 : 0];
	}

	step() {
		if (this.inRange) { do { this.pos++; } while (
			this.arr[this.pos] && this.arr[this.pos].length !== 2
		); }
		this.inRange = !this.inRange;
	}
}

const decorate = (arr, prop, index) => Object.defineProperty(
		arr, prop, {
			get: () => {
				return arr[index];
			}, set: (v) => {
				arr[index] = v;
			}, configurable: true
		}
	),

	makeRange = (range) => {
		let arr, bounded;

		// console.log(Array.isArray(range), range);

		if (Array.isArray(range)) {
			arr = range;
			bounded = arr.length === 2;
		} else {
			arr = [ range.start ];
			if (typeof (bounded = range.end) !== 'undefined') {
				arr.push(range.end);
			} else {
				arr.push(range.before || 0, range.after || 0);
			}
		}

		if (!arr.start) {
			decorate(arr, 'start', 0);
			if (bounded) {
				decorate(arr, 'end', 1);
			} else {
				decorate(arr, 'before', 1);
				decorate(arr, 'after', 2);
			}
		}

		if (range.value) { arr.value = range.value; }

		// console.log("MKRANGE", arr);
		return arr;
	};

class RangeArray {
	constructor(ranges) {
		if (ranges instanceof RangeArray) {
			ranges = ranges.arr;
		}

		if (!Array.isArray(ranges)) {
			ranges = [];
		}

		this.arr = ranges.map(range => makeRange(range));
		this[Symbol.iterator] = this.arr[Symbol.iterator].bind(this.arr);
		Object.defineProperty(this, 'length', {
			get: () => this.arr.length
		});
	}

	/*
		Finds the index of the range containing a particular value.
		@param value - What to find
		@param [start=0] - Index position to start at
		@param [end=length] - Index position to end
	*/
	indexOf(value) {
		let pos, start = 0, end = this.arr.length;

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
		let a = new Stepper(this),
			b = new Stepper(ranges),
			res = [];

		function pushBound(value) {
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
				if (!b.inRange) pushBound(na);
				a.step();
			} else {
				if (a.inRange) pushBound(nb);
				b.step();
			}
		}

		if (a.arr.length === 0) { return new RangeArray([]); }
		if (b.arr.length === 0) { return new RangeArray(this); }

		while (a.pos <= a.arr.length && b.pos <= b.arr.length) { step(); }
		return new RangeArray(res);
	}

	intersect(ranges) {
		let a = new Stepper(this),
			b = new Stepper(ranges),
			res = [];

		function pushBound(value) {
			if (res.length === 0 || res[res.length - 1].length === 2) {
				res.push([ value ]);
			} else {
				res[res.length - 1].push(value);
			}
		}

		function step() {
			let na = a.next(),
				nb = b.next();

			if (na < nb) {
				if (b.inRange) pushBound(na);
				a.step();
			} else if (nb < na) {
				if (a.inRange) pushBound(nb);
				b.step();
			} else {
				if (a.inRange === b.inRange) {
					pushBound(na);
					a.step();
					b.step();
				} else if (!a.inRange) {
					pushBound(na);
					a.step();
				} else {
					pushBound(nb);
					b.step();
				}
			}
		}

		while (a.pos < a.arr.length && b.pos < b.arr.length) { step(); }
		return new RangeArray(res);
	}

	add(a) {
		let range = makeRange(a),
			startPos = this.indexOf(range[0]),
			endPos;
		if (range.length === 3) {
			if (
				!this.arr[startPos] ||
				this.arr[startPos][0] !== range[0] ||
				this.arr[startPos].length !== range.length
			) {
				this.arr.splice(startPos, 0, range);
				return;
			}
			this.arr[startPos][1] = Math.max(this.arr[startPos][1], range[1]);
			this.arr[startPos][2] = Math.max(this.arr[startPos][2], range[2]);
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
		let range = makeRange(r),
			startPos = this.indexOf(range[0]);

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

	packArguments () {
		return [ this.arr ];
	}
}

RangeArray.makeRange = makeRange;
export default RangeArray;
