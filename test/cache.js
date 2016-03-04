/* eslint-env mocha */
/* eslint no-console:0 */
'use strict';

require('babel-core/register')({sourceMaps: 'inline'});

let Cache = require('../lib/Cache'),
	OrderedArray = Cache.OrderedArray,
	assert = require('assert');

describe('should insert a single entity', function () {
	let cache, room;

	beforeEach(() => {
		cache = new Cache();
		room = {
			id: 'numix',
			type: 'room',
			description: 'GTK+ and Gnome Shell themes.'
		};
	});

	it('checking if the insert was successful', function() {
		cache.put({ entities: { numix: room }});
		assert.deepEqual(cache.entities, { numix: room });
		assert.deepEqual(cache.getEntity('numix'), room);
	});

	it('checking if callback of getEntity is fired if entity doesnt exist', function(done) {

		cache.onChange(function(changes) {
			if (
				changes.queries && changes.queries.entities &&
				changes.queries.entities.alice === true
			) {
				cache.put({ entities: { alice: null } });
			}
		});


		assert.deepEqual(
			cache.getEntity('alice', function(err, entity) {
				assert(!err, 'threw an error');
				assert(!entity, 'entity doesnt exist');
				done();
			}),
			{ type: 'loading' }
		);

		assert.deepEqual(cache.queries, { entities: { alice: true } });
	});


	it('checking if callback of getEntity is fired if entity is added later', function(done) {
		let callbackFired = false;

		cache.onChange(function(changes) {
			if (
				changes.queries && changes.queries.entities &&
				changes.queries.entities.alice === true
			) {
				cache.put({ entities: { alice: {
					id: 'alice',
					createTime: 140000000,
					description: 'stupid day dreamer'
				} } });
			}
		});

		cache.getEntity('alice', function(err, entity) {
			assert(!callbackFired, 'callback fired twice');
			callbackFired = true;
			assert(!err, 'threw an error');
			assert.deepEqual(entity, {
				id: 'alice',
				createTime: 140000000,
				description: 'stupid day dreamer'
			});
			cache.put({ entities: { alice: null } });
			setTimeout(done, 100);
		});
	});
});

describe('should insert a new range and query it', function () {
	let cache = new Cache();
	cache.put({
		knowledge: { 'room:updateTime!(:)': [ [ 0, 7 ] ] },
		indexes: { 'room:updateTime!(:)': [
			{ id: 'numix', updateTime: 1 },
			{ id: 'scrollback', updateTime: 3 },
			{ id: 'bangalore', updateTime: 6 }
		] }
	});

	it('simple query', function() {
		let res = cache.query('room:updateTime!(:)', [ 1, 5 ]);

		assert.equal(res.get().length, 2, 'incorrect results');
		assert.equal(res.get(0).updateTime, 1, 'incorrect item');
		assert.equal(res.get(1).updateTime, 3, 'incorrect item');
	});

	it('query with loading at the end', function() {
		let res = cache.query('room:updateTime!(:)', [ 1, 9 ]);
		assert.equal(res.get().length, 4, 'incorrect results');
		assert.equal(res.get(0).updateTime, 1, 'incorrect item');
		assert.equal(res.get(1).updateTime, 3, 'incorrect item');
		assert.equal(res.get(2).updateTime, 6, 'incorrect item');
		assert.equal(res.get(3).updateTime, 7, 'incorrect item');
		assert.equal(res.get(3).type, 'loading', 'incorrect item');
	});

	it('query with 3 property ranges with after only single item', function() {
		let res = cache.query('room:updateTime!(:)', [ 3, 0, 1 ]);
		assert.equal(res.get().length, 1, 'incorrect results');
		assert.equal(res.get(0).updateTime, 3, 'incorrect item');
	});

	it('query with 3 property ranges with after only: multiple items with no loading', function() {
		let res = cache.query('room:updateTime!(:)', [ 1, 0, 3 ]);
		assert.equal(res.get().length, 3, 'incorrect results');
		assert.equal(res.get(0).updateTime, 1, 'incorrect item');
		assert.equal(res.get(1).updateTime, 3, 'incorrect item');
		assert.equal(res.get(2).updateTime, 6, 'incorrect item');
	});

	it.only('Cache.query should fire callback on getting data', function(done) {
		cache.onChange(function(changes) {
			if (changes.queries && changes.queries["text:createTime"]) {
				cache.put({
					knowledge: {
						'text:createTime': new Cache.RangeArray([ [ 1, 3 ] ])
					},
					indexes: {
						'text:createTime': new Cache.OrderedArray(['createTime'], [
							{
								createTime: 1,
								type: 'text',
								body: 'hi',
								id: "aksdfjn"
							},
							{
								createTime: 2,
								type: 'text',
								body: 'hi',
								id: "askdjfkshd"
							},
							{
								createTime: 3,
								type: 'text',
								body: 'hi',
								id: "aksdcilaeukajsn"
							}
						])
					}
				});
			}
		});

		let res = cache.query(
			cache.sliceToKey({ type: 'text', order: 'createTime'}),
			[ 1, 3 ],
			function(err, data) {
				console.log("ha");
				assert(!err, 'Error thrown');
				assert.equal(data.length, 3, 'callback fired with new items');
				done();
			}
		);

		assert.deepEqual(res, new OrderedArray([ 'createTime' ], [
			{ type: "loading", createTime: 1, start: 1, end: 3 }
		]));

	});
});

describe('query for cache with infinity in the end', function() {
	let cache = new Cache({
		is: (entity, type) => { return type === 'relation'; }
	});
	cache.put({
		knowledge: { 'relation:roleTime!(:)': [ [ 0, +Infinity ] ] },
		indexes: { 'relation:roleTime!(:)': [
			{ id: 'harish_numix', roleTime: 1 },
			{ id: 'satya_numix', roleTime: 3 },
			{ id: 'aravind_numix', roleTime: 6 }
		] }
	});

	it('query with 2 prop ranges', function () {
		let res = cache.query('relation:roleTime!(:)', [ 1, 9 ]);
		assert.equal(res.get(0).roleTime, 1, 'incorrect item');
		assert.equal(res.get(1).roleTime, 3, 'incorrect item');
		assert.equal(res.get(2).roleTime, 6, 'incorrect item');
	});

	it("query with 3 prop ranges: shouldn't return loading at the end.", function () {
		let res = cache.query('relation:roleTime!(:)', [ 3, 0, 3 ]);
		assert.equal(res.get().length, 2, 'incorrect results');
		assert.equal(res.get(0).roleTime, 3, 'incorrect item');
		assert.equal(res.get(1).roleTime, 6, 'incorrect item');
	});
	it('query with 3 prop ranges: should give loading in the beginning and add a query.', function () {
		let res = cache.query('relation:roleTime!(:)', [ 3, 2, 3 ]);

		assert.equal(res.get().length, 4, 'length not correct on ');
		assert.equal(res.get(0).type, 'loading', 'incorrect item');
		assert.equal(res.get(1).roleTime, 1, 'incorrect item');
		assert.equal(res.get(2).roleTime, 3, 'incorrect item');
		assert.equal(res.get(3).roleTime, 6, 'incorrect item');
		assert(Object.keys(cache.queries).length, 'no queries added');
	});
});


describe('should index entities when adding knowledge: ', function () {
	let cache = new Cache({
		is: (entity, type) => { return type === 'relation'; }
	});
	cache.put({
		entities: {
			harish_numix: { id: 'harish_numix', roleTime: 1 },
			aravind_numix: { id: 'aravind_numix', roleTime: 3 },
			satya_numix: { id: 'satya_numix', roleTime: 6 }
		}
	});
	cache.put({
		knowledge: { 'relation:roleTime!(:)': [ [ 0, +Infinity ] ] }
	});
	it('adding knowledge should add the indexes', function() {
		assert(Object.keys(cache.indexes).length, 'no index added');
	});
});

describe('deleting an item which is part of an index: ', function () {
	let cache = new Cache();
	cache.put({
		knowledge: { 'room:updateTime!(:)': [ [ 0, 7 ] ] },
		indexes: { 'room:updateTime!(:)': [
			{ id: 'numix', type: 'room', updateTime: 1 },
			{ id: 'scrollback', type: 'room', updateTime: 3 },
			{ id: 'bangalore', type: 'room', updateTime: 6 }
		] }
	});

	cache.put({
		entities: {
			numix: null
		}
	});

	it('item should be deleted', function() {
		let res = cache.query('room:updateTime!(:)', [ 1, 9 ]);
		assert(res.get(0).id !== 'numix', 'didnt delete');
	});
});

it("getEntity callback fired when indexes are put", (done) => {
	let cache = new Cache();
	cache.getEntity("test123", (err, entity) => {
		assert.deepEqual(entity, {id: 'test123', type: 'room', updateTime: 3});
		done();
	});
	cache.put({
		knowledge: { 'room:updateTime!(:)': [ [ 0, 7] ] },
		indexes: { 'room:updateTime!(:)': [
			{ id: 'test123', type: 'room', updateTime: 3 }
		] }
	});
});

/*
	TODO:
	Existing entities should be indexed when adding knowledge.
	Queries should be added to cache.queries
	Cache._recentQueries should be updated
*/
