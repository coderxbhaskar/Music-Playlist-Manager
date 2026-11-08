/**
 * Doubly Circular Linked List for the Looplist Music Playlist Manager.
 *
 *   head <-> song2 <-> song3 <-> ... <-> tail
 *     ^______________________________________|   (tail.next = head, head.prev = tail)
 *
 * Every node always has a non-null next and prev, so navigation
 * never "falls off" the end of the playlist.
 */
class SongNode {
  constructor(id, title, artist, album, duration) {
    this.id = id;
    this.title = title;
    this.artist = artist;
    this.album = album;
    this.duration = duration; // seconds
    this.favorite = false;
    this.next = null;
    this.prev = null;
  }
}

class PlaylistCircularList {
  constructor() {
    this.head = null;     // first song
    this.current = null;  // currently selected song
    this.size = 0;
  }

  isEmpty() {
    return this.size === 0;
  }

  /** Add a song at the end of the playlist. O(1) thanks to head.prev === tail. */
  add(id, title, artist, album, duration) {
    if (this.findById(id)) throw new Error(`Song ID "${id}" already exists.`);
    const node = new SongNode(id, title, artist, album || "Single", duration);

    if (this.isEmpty()) {
      node.next = node;
      node.prev = node;
      this.head = node;
      this.current = node;
    } else {
      const tail = this.head.prev;
      node.next = this.head;   // new tail points forward to head
      node.prev = tail;
      tail.next = node;
      this.head.prev = node;   // head points back to new tail
    }
    this.size++;
    return node;
  }

  /** Remove a node by reference, fixing the circular links. */
  _unlink(node) {
    if (this.size === 1) {
      this.head = null;
      this.current = null;
    } else {
      node.prev.next = node.next;
      node.next.prev = node.prev;
      if (node === this.head) this.head = node.next;
      if (node === this.current) this.current = node.next;
    }
    node.next = node.prev = null;
    this.size--;
  }

  removeById(id) {
    const node = this.findById(id);
    if (!node) return null;
    const data = { id: node.id, title: node.title };
    this._unlink(node);
    return data;
  }

  removeByTitle(title) {
    const node = this.findByTitle(title);
    if (!node) return null;
    const data = { id: node.id, title: node.title };
    this._unlink(node);
    return data;
  }

  /** Visit each node exactly once, starting at head, stopping when we loop back. */
  toArray() {
    const out = [];
    if (this.isEmpty()) return out;
    let node = this.head;
    do {
      out.push(node);
      node = node.next;
    } while (node !== this.head);
    return out;
  }

  findById(id) {
    if (this.isEmpty()) return null;
    const q = String(id).trim().toLowerCase();
    let node = this.head;
    do {
      if (String(node.id).toLowerCase() === q) return node;
      node = node.next;
    } while (node !== this.head);
    return null;
  }

  /** Case-insensitive title match; exact match first, then partial. */
  findByTitle(title) {
    if (this.isEmpty()) return null;
    const q = String(title).trim().toLowerCase();
    if (!q) return null;
    let partial = null;
    let node = this.head;
    do {
      const t = node.title.toLowerCase();
      if (t === q) return node;
      if (!partial && t.includes(q)) partial = node;
      node = node.next;
    } while (node !== this.head);
    return partial;
  }

  /** Move to next song. From the last song this wraps to the first. */
  next() {
    if (this.isEmpty()) return null;
    this.current = this.current.next;
    return this.current;
  }

  /** Move to previous song. From the first song this wraps to the last. */
  prev() {
    if (this.isEmpty()) return null;
    this.current = this.current.prev;
    return this.current;
  }

  /** Jump straight to a song by ID or title. */
  goTo(query) {
    const node = this.findById(query) || this.findByTitle(query);
    if (node) this.current = node;
    return node;
  }

  /** Repeat the playlist: jump from the last song back to the first. */
  repeat() {
    if (this.isEmpty()) return null;
    this.current = this.head;
    return this.current;
  }

  toggleFavorite(id) {
    const node = this.findById(id);
    if (node) node.favorite = !node.favorite;
    return node;
  }

  isLast(node) {
    return !this.isEmpty() && node === this.head.prev;
  }

  getCurrent() {
    return this.current;
  }

  getSize() {
    return this.size;
  }

  totalDuration() {
    return this.toArray().reduce((sum, n) => sum + n.duration, 0);
  }

  clear() {
    this.head = this.current = null;
    this.size = 0;
  }
}

if (typeof module !== "undefined") module.exports = { PlaylistCircularList, SongNode };
