"use strict";
let juri = require("juri")(),
	pattern = /(^|[+\-:!])(\w+|\([^(]+\))/g;

exports.sliceToKey = (s) => s.type +
	(s.join ? "+" + juri.encode(s.join) : "") +
	(s.link ? "-" + juri.encode(s.link) : "") +
	(s.order ? ":" + s.order : "") +
	(s.filter ? "!" + juri.encode(s.filter) : "");

exports.keyToSlice = (k) => {
	let s = {};

	k.match(pattern).forEach((part, i) => {
		if (i === 0) { s.type = part; }
		else if (part[0] === "+") { s.join = juri.decode(part.substr(1)); }
		else if (part[0] === "-") { s.link = juri.decode(part.substr(1)); }
		else if (part[0] === ":") { s.order = part.substr(1); }
		else if (part[0] === "!") { s.filter = juri.decode(part.substr(1)); }
	});

	return s;
};
