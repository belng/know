Index Classes
=============

Indexes have various attributes which affect how they function. Each valid combination of these attributes is known as an Index Class.

**Unique/Repeating** Similar to databases, in unique indexes each index value corresponds to only one item; In repeating indexes each value may have multiple items.

**Continuous/Discrete** Continuous indexes are equivalent to B-Tree indexes in databases, in that they allow range queries as the property that is indexed is a number. e.g. Indexes ordered by createTime. Discrete indexes are like Hash indexes; they index a string property and can only do exact matches. e.g. identities.

If continuous, the index property is called `order` in slices and is prefixed with a `:` in keys. All continuous indexes are considered repeating.

If discrete, the index property is called `prop` in slices and prefixed with a `.` (if unique) or `,` (if repeating) in keys. Slices will also contain a boolean flag `unique`.

**Join/Simple** Join index items are records containing two or more typed objects that are related to each other; Simple indexes contain typed objects directly.

Joins are indicated by a `join` or `link` property in slices, and by a `+` or `-` in the type component of keys. For more details, see [compound.md](compound.md)

**Aggregate/Primitive**: If the indexed property contains an array or object, each element in it becomes a separate index value. Indexes where this is expected to happen are called aggregate indexes, otherwise primitive. No aggregate/primitive distinction is made in slices or the key; Instead, type checking is done at index insertion time.

**Combinations and examples**

*Examples in italics are hypothetical and aren't necessary in HeyNeighbor*

Index class | Example                                                   | Impl
------------|-----------------------------------------------------------|-----
CRSP        | **text:createTime**                                       | Y
CRJP        | **text+(rel:item):createTime**                            | Y
DUSP        | *user.email*                                              | N
DUSA        | **user.identities**                                       | N
DUJP        | *room+(rel:item).slug*                                    | N
DUJA        | *room+(rel:item).identities*                              | N
DRSP        | *thread,color*                                            | N
DRSA        | *thread,tag*                                              | N
DRJP        | *thread+(rel:item),color*                                 | N
DRJA        | *thread+(rel:item),tag*                                   | N

`entities` can be considered a Discrete, Unique, Simple, Primitive (DUSP) index on the id property.

#### Representation ####

**Continuous**

Indexes are stored in TypedArrays, Knowledge and Queries in RangeArrays.

**Discrete**

Indexes are stored in JS Objects. Knowledge is stored within the index itself: `undefined` represents unknown and `false` represents nonexistent. In queries, `true` represents a sought value.

```javascript
{
	queries: { "user.identities": { "harish": true } }, /* request loading */
	indexes: { "user.identities": {
		"satya": {...},
		"chandra": false /* definitely does not exist */
	}
}
```

**Index items**

Attributes | Representation
-----------|---------------
Unique, Simple | { ... }
Unique, Join | { type1: { ... }, type2: { ... } }
Discrete, Repeated, Simple | [{ ... }]
Discrete, Repeated, Join | [{ type1: { ... }, type2: { ... } }]
