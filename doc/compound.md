Compound Types
==============

These are designed to handle things like getTextsAndRelations(),
getRelatedRooms(), etc.

Examples
--------

### getRelatedRooms

Here, rel is the base type, and it contains a **link** to the `room` type. The
link is made via a property `item` on rel objects.

#### Slice
	{
		type: rel,
		link: { room: item }, // a link, so item is a property of base type rel
		filter: { user: ..., role_gt: none },
		order: statusTime
	}

#### Key
	rel+room-item:statusTime(role_gt:none,user:...)

#### Index item
	{ rel: ..., item: ... }

### getTextsAndRels

Here, the connection is through a **join** — rel objects (the joined object) contain a property (`item`) which has the id of the connected text objects.

#### Slice
	{
		type: text,
		join: { rel: item }, // a join, so item is a property of join type rel
		filter: { thread: ..., user: ...},
		order: createTime
	}

#### Key
	text+rel.item:createTime(thread:...,user:...)

#### Index items
	{ text: ..., rel: ... }


Base, Join and Link Types
-------------------------

In slices, links and joins are specified as { <type name>: <property name> }, and the index items will be objects whose property names are all type names.

If this would cause a name conflict (e.g. a link whose type is the same as
the base type), alias one of the types using the `is()` helper function.

The `order` MUST be a field of the base type.

Example: `room+rel:createTime` is valid but `room+rel:statusTime` is not. If
sorting by `statusTime` is required, use `rel+room:statusTime`.

In indexes, the object of the primary type is known as the primary object, and the rest are secondary objects.

Every index entry MUST have a primary object. The secondary object may be replaced with undefined, indicating that the object is not in the cache, or false, indicating that it does not exist. (This is consistent with the representation of unknown and nonexistent in entities.)

Example: In a `text+rel:createTime` index, which will have entries like `{ text: ..., rel: ... }`, every text property must point to a valid text object. The rel properties may point to rel objects, be undefined or have the value false.

Handling changes
----------------

- if a bulk response (query response) is received (i.e. if `changes.indexes[key]` is defined), each object is added separately into entities.

- if an entity is created, (`changes.entities[id]` is defined), it is added to the indexes where it is either the base type or a joined type. Extending this to indexes where it is a linked type is desired but not currently implemented as it is requires a new data structure to keep track of incomplete index entries with links, and the functionality is not required in HeyNeighbor.

Handling queries
----------------

Nothing special needs to be done, existing query handling should be sufficient.
