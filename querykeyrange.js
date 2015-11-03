"use strict";
let juri = require("juri")();

exports.queryToKeyrange = function queryToKeyrange (q) {
	return {
		key: q.type + ":" + q.order + juri.encode(q.filter),
		range: juri.encode(q.range.end ?
			[ q.range.start, q.range.end ] :
			[ q.range.start, q.range.before || 0, q.range.after || 0 ]
		)
	};
};

exports.keyrangeToQuery = function keyrangeToQuery (k, r) {
	let decodedR = juri.decode(r), ix = k.indexOf("("),
		to = k.substr(0, ix >= 0 ? ix : k.length).split(":"),
		q = { type: to[0], range: { start: decodedR[0] }, filter: juri.decode(k.substr(ix)), order: to[1]};

	if (decodedR.length) {
		if (decodedR.length === 2) {
			q.range.end = decodedR[1];
		} else {
			if (decodedR[1]) { q.range.before = decodedR[1]; }
			if (decodedR[2]) { q.range.after = decodedR[2]; }
		}
	}

	return q;
};
