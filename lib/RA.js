"use strict";

function extend(arr, proto) {
	Object.getOwnPropertyNames(proto).forEach(name => {
		arr[name] = proto[name];
	});
	return arr;
}

class RA {
	constructor() {
		return extend([], Object.getPrototypeOf(this));
	}

	boo() {
		console.log("boo");
	}

	slice() {
		console.log("slice");
	}
}

module.exports = RA;
