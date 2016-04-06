'use strict';
let juri = require('juri')(),
	pattern = /(^|[+\-:])(\w+|\([^(]+\))/g;

let sliceToKey = (s) => s.type +
	(s.join ? '+' + juri.encode(s.join) : '') +
	(s.link ? '-' + juri.encode(s.link) : '') +
	(s.order ? ':' + s.order : '') +
	(s.index ? '/' + s.index : '') +
	(s.filter && Object.keys(s.filter).length ?
		'!' + juri.encode(s.filter) : '');

let keyToSlice = (k) => {
	let s = {}, parts = k.split('!');

	if (parts[1]) s.filter = juri.decode(parts[1]);

	parts[0].match(pattern).forEach((part, i) => {
		if (i === 0) { s.type = part; }
		else if (part[0] === '+') { s.join = juri.decode(part.substr(1)); }
		else if (part[0] === '-') { s.link = juri.decode(part.substr(1)); }
		else if (part[0] === ':') { s.order = part.substr(1); }
		else if (part[0] === '/') { s.index = part.substr(1); }
	});

	return s;
};

let keySlice = (d) => {
	return typeof d === 'string' ?
	{ key: d, slice: keyToSlice(d) } :
	{ key: sliceToKey(d), slice: d };
};

export { keySlice, keyToSlice, sliceToKey };
