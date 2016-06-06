'use strict';
import Juri from 'juri';

const juri = Juri(),
	pattern = /(^|[+\-:])(\w+|\([^(]+\))/g;

export function sliceToKey (s) {
	return s.type +
		(s.join ? '+' + juri.encode(s.join) : '') +
		(s.link ? '-' + juri.encode(s.link) : '') +
		(s.order ? ':' + s.order : '') +
		(s.index ? '/' + s.index : '') +
		(s.filter && Object.keys(s.filter).length ? '!' + juri.encode(s.filter) : '');
}

export function keyToSlice(k) {
	const s = {}, parts = k.split('!');

	if (parts[1]) s.filter = juri.decode(parts[1]);

	parts[0].match(pattern).forEach((part, i) => {
		if (i === 0) {
			s.type = part;
		} else if (part[0] === '+') {
			s.join = juri.decode(part.substr(1));
		} else if (part[0] === '-') {
			s.link = juri.decode(part.substr(1));
		} else if (part[0] === ':') {
			s.order = part.substr(1);
		} else if (part[0] === '/') {
			s.index = part.substr(1);
		}
	});

	return s;
}

export function keySlice(q) {
	return typeof q === 'string' ?
		{ key: q, slice: keyToSlice(q) } :
		{ key: sliceToKey(q), slice: q };
}

const operators = {
	cts: (left, right) => right.every(val => left.indexOf(val) > -1),
	ctd: (left, right) => left.every(val => right.indexOf(val) > -1),
	olp: (left, right) => left.some(val => right.indexOf(val) > -1),
	pref: (left, right) => left.startsWith(right)
};

export function checkFilter(entity, prop, value) {
	const parts = prop.split('_');
	if (parts.length === 1) {
		if (!(prop in entity)) return true;
		// Hack: Remove when entities and updates are separated.
		return entity[prop] === value;
	} else {
		return operators[parts[1]](entity[parts[0]], value);
	}
}

export function checkFilters(item, slice) {
	function checkEachFilter(entity, filter) {
		for (const prop in filter) {
			if (!checkFilter(entity, prop, filter[prop])) {
				return false;
			}
		}
		return true;
	}

	if (slice.link || slice.join) {
		for (const type in slice.filter) {
			if (!(type in item) || item[type].type === 'loading') continue;
			// Hack: Remove when discrete queries are fully supported.
			if (!checkEachFilter(item[type], slice.filter[type])) {
				return false;
			}
		}
		return true;
	} else {
		return checkEachFilter(item);
	}
}

export function getDual(q, type) {
	const { slice } = keySlice(q);

	if (slice.join && type in slice.join) {
		const prop = slice.join[type];

		return keySlice({
			type, index: prop,
			link: { [slice.type]: prop },
			filter: slice.filter
		});
	} else {
		const prop = slice.link[type];

		return keySlice({
			type: slice.type, index: prop,
			link: { [type]: prop },
			filter: slice.filter
		});
	}
}

export function arrayOrder(s) {
	return (s.join || s.link) ? [ s.type, s.order ] : [ s.order ];
}
