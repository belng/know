"use strict";
let juri = require("juri")();

exports.sliceToKey = (s) => s.type + ":" + s.order + juri.encode(s.filter);

exports.keyToSlice = (k) => {
	let col = k.indexOf(":"), par = k.indexOf("(", col);

	return {
		type: k.substr(0, col),
		filter: juri.decode(k.substr(par)),
		order: k.substr(col + 1, par - col - 1)
	};
};
