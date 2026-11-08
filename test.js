// Run with: node test.js
const assert = require("assert");
const { PlaylistCircularList } = require("./circularList");

const p = new PlaylistCircularList();
assert(p.isEmpty() && p.next() === null && p.prev() === null && p.repeat() === null);

p.add("S1", "Alpha", "A", "Album A", 100);
p.add("S2", "Beta", "B", "Album B", 200);
p.add("S3", "Gamma", "C", "Album C", 300);
assert.strictEqual(p.getSize(), 3);
assert.strictEqual(p.totalDuration(), 600);

// circular links
assert.strictEqual(p.head.prev.id, "S3");
assert.strictEqual(p.head.prev.next, p.head);

// next wraps last -> first
assert.strictEqual(p.getCurrent().id, "S1");
p.next(); p.next();
assert.strictEqual(p.getCurrent().id, "S3");
assert(p.isLast(p.getCurrent()));
p.next();
assert.strictEqual(p.getCurrent().id, "S1");

// prev wraps first -> last
p.prev();
assert.strictEqual(p.getCurrent().id, "S3");

// goTo by id and title (case-insensitive, partial)
assert.strictEqual(p.goTo("s2").title, "Beta");
assert.strictEqual(p.goTo("gam").id, "S3");
assert.strictEqual(p.goTo("nope"), null);

// repeat
p.repeat();
assert.strictEqual(p.getCurrent().id, "S1");

// favorites
assert.strictEqual(p.toggleFavorite("S2").favorite, true);
assert.strictEqual(p.toggleFavorite("S2").favorite, false);

// duplicate ID rejected
assert.throws(() => p.add("S1", "Dup", "D", "X", 1));

// remove middle
p.removeById("S2");
assert.deepStrictEqual(p.toArray().map((n) => n.id), ["S1", "S3"]);
assert.strictEqual(p.head.prev.id, "S3");

// remove current -> current moves on
p.goTo("S1");
p.removeByTitle("Alpha");
assert.strictEqual(p.head.id, "S3");
assert.strictEqual(p.getCurrent().id, "S3");

// remove last remaining
p.removeById("S3");
assert(p.isEmpty() && p.head === null && p.getCurrent() === null);

console.log("All circular linked list tests passed ✔");
