// UI layer. All playlist logic lives in PlaylistCircularList (circularList.js).
const list = new PlaylistCircularList();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const KEY = "looplist-v2";
const CAPACITY = 50;

const state = {
  view: "playlist",
  query: "",
  playing: false,
  elapsed: 0,
  muted: false,
  updated: Date.now(),
  name: "Night drive essentials",
};

// ---------- icons ----------
const ICONS = {
  play: '<polygon points="6 4 20 12 6 20 6 4"/>',
  pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  prev: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5"/>',
  next: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/>',
  repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
  mute: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/>',
  queue: '<line x1="3" y1="6" x2="16" y2="6"/><line x1="3" y1="12" x2="16" y2="12"/><line x1="3" y1="18" x2="11" y2="18"/><polygon points="17 14 22 18 17 22 17 14"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  disc: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
};
const FILLED = new Set(["play", "pause", "prev", "next"]);

function icon(name, size = 16) {
  const fill = FILLED.has(name) ? "currentColor" : "none";
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
}
function hydrateIcons(root = document) {
  $$("i[data-icon]", root).forEach((el) => {
    el.innerHTML = icon(el.dataset.icon, Number(el.dataset.size) || 16);
  });
}

// ---------- helpers ----------
const parseDuration = (str) => {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
};
const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
function fmtTotal(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}h ${m}m` : `${m}m ${s}s`;
}
function esc(v) {
  const d = document.createElement("div");
  d.textContent = String(v);
  return d.innerHTML;
}
function hash(str) {
  let h = 0;
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}
function coverBg(seed) {
  const h = hash(seed) % 360;
  return `radial-gradient(circle at 30% 28%, hsl(${(h + 40) % 360} 92% 66%), transparent 55%), linear-gradient(135deg, hsl(${h} 60% 16%), hsl(${(h + 300) % 360} 70% 46%))`;
}
const cover = (seed) => `<span class="cover" style="background:${coverBg(seed)}"></span>`;

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.hidden = true), 2400);
}

function nextId() {
  let max = 0;
  list.toArray().forEach((n) => {
    const m = /(\d+)$/.exec(n.id);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `TRK-${String(max + 1).padStart(2, "0")}`;
}

// ---------- persistence ----------
function save() {
  try {
    const cur = list.getCurrent();
    localStorage.setItem(KEY, JSON.stringify({
      songs: list.toArray().map((n) => ({ id: n.id, title: n.title, artist: n.artist, album: n.album, duration: n.duration, favorite: n.favorite })),
      current: cur ? cur.id : null,
      updated: state.updated,
      name: state.name,
    }));
  } catch (e) { /* storage unavailable: app still works */ }
}
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw) return;
    raw.songs.forEach((s) => { list.add(s.id, s.title, s.artist, s.album, s.duration).favorite = !!s.favorite; });
    if (raw.current) list.goTo(raw.current);
    if (raw.updated) state.updated = raw.updated;
    if (raw.name) state.name = raw.name;
  } catch (e) { /* ignore corrupt data */ }
}

// ---------- derived data ----------
function visibleSongs() {
  let songs = list.toArray();
  if (state.view === "queue" && !list.isEmpty()) {
    const i = songs.indexOf(list.getCurrent());
    songs = songs.slice(i).concat(songs.slice(0, i)); // circular order starting from current
  }
  if (state.view === "favorites") songs = songs.filter((s) => s.favorite);
  const q = state.query.trim().toLowerCase();
  if (q) songs = songs.filter((s) => [s.id, s.title, s.artist, s.album].some((v) => String(v).toLowerCase().includes(q)));
  return songs;
}

// ---------- rendering ----------
const VIEW_INFO = {
  overview: ["Overview", "Playlist tracks", "Manage the songs in your circular linked list."],
  playlist: ["Playlist", "Playlist tracks", "Manage the songs in your circular linked list."],
  queue: ["Queue", "Up next", "Play order of the circular list, starting from the current song."],
  favorites: ["Favorites", "Favorite tracks", "Songs you marked with a heart."],
  artists: ["Artists", "Artists", "Click an artist to see their songs."],
  albums: ["Albums", "Albums", "Click an album to see its songs."],
};

function renderNav() {
  $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === state.view));
  $("#navCount").textContent = list.getSize();
  $("#crumb").textContent = `Workspace / ${VIEW_INFO[state.view][0]}`;
}

function renderHero() {
  const cur = list.getCurrent();
  $("#heroArt").style.backgroundImage = coverBg(cur ? cur.id : "Looplist");
  $("#playlistName").textContent = state.name;
  $("#statTracks").textContent = list.getSize();
  $("#statDuration").textContent = fmtTotal(list.totalDuration());
  const d = new Date(state.updated);
  $("#statUpdated").textContent = d.toDateString() === new Date().toDateString()
    ? "Today"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function renderNow() {
  const cur = list.getCurrent();
  const card = $("#nowCard");
  const pill = `<span class="pill ${state.playing ? "live" : ""}">${state.playing ? "PLAYING" : "PAUSED"}</span>`;
  const links = cur
    ? `<div class="links">
         <span>${icon("repeat", 13)} Circular links:</span>
         <span><b>${esc(cur.prev.title)}</b> ← prev</span>
         <span>next → <b>${esc(cur.next.title)}</b></span>
         ${list.isLast(cur) ? '<span class="wrap">· last song loops to first</span>' : ""}
       </div>`
    : "";
  card.innerHTML = `
    <div class="now-head"><span>Now playing</span>${pill}</div>
    ${cur
      ? `<div class="now-song">${cover(cur.id)}<div><strong>${esc(cur.title)}</strong><span>${esc(cur.artist)}</span></div></div>
         <div class="progress">
           <div class="seek" id="seek"><div id="seekFill"></div></div>
           <div class="times"><span id="tElapsed">0:00</span><span>${fmt(cur.duration)}</span></div>
         </div>`
      : `<div class="now-empty">Nothing selected yet. Add a song to begin.</div>`}
    <div class="controls">
      <button class="icon-btn" data-act="repeat" title="Repeat playlist (go back to the first song)">${icon("repeat", 18)}</button>
      <button class="icon-btn" data-act="prev" title="Previous song">${icon("prev", 20)}</button>
      <button class="play-btn" data-act="toggle" title="Play / pause">${icon(state.playing ? "pause" : "play", 20)}</button>
      <button class="icon-btn" data-act="next" title="Next song">${icon("next", 20)}</button>
      <button class="icon-btn" data-act="mute" title="Mute (visual only)">${icon(state.muted ? "mute" : "volume", 18)}</button>
    </div>
    ${links}`;
  updateProgress();
}

function updateProgress() {
  const cur = list.getCurrent();
  const fill = $("#seekFill");
  if (!cur || !fill) return;
  fill.style.width = `${Math.min(100, (state.elapsed / cur.duration) * 100)}%`;
  $("#tElapsed").textContent = fmt(state.elapsed);
}

function renderTracks() {
  const [, title, sub] = VIEW_INFO[state.view];
  $("#tracksTitle").textContent = title;
  $("#tracksSub").textContent = sub;
  const body = $("#tracksBody");

  // Artists / Albums grouped views
  if (state.view === "artists" || state.view === "albums") {
    const key = state.view === "artists" ? "artist" : "album";
    const map = new Map();
    list.toArray().forEach((s) => map.set(s[key], [...(map.get(s[key]) || []), s]));
    if (!map.size) return (body.innerHTML = emptyState());
    body.innerHTML = `<div class="groups">${[...map].map(([name, songs]) => `
      <button class="group" data-group="${esc(name)}">${cover(name)}<div><b>${esc(name)}</b><small>${songs.length} song${songs.length > 1 ? "s" : ""}</small></div></button>`).join("")}</div>`;
    return;
  }

  const all = list.toArray();
  const songs = visibleSongs();
  const cur = list.getCurrent();

  if (!all.length) return (body.innerHTML = emptyState());
  if (!songs.length) {
    return (body.innerHTML = `<div class="empty">${state.view === "favorites" && !state.query ? "No favorites yet. Use the ⋯ menu on a song to add one." : "No songs match your search."}</div>`);
  }

  const rows = songs.map((n, i) => {
    const isCur = n === cur;
    const num = isCur
      ? `<span class="eq ${state.playing ? "" : "paused"}"><span></span><span></span><span></span></span>`
      : state.view === "queue" ? i + 1 : all.indexOf(n) + 1;
    return `
      <div class="t-row ${isCur ? "active" : ""}" data-id="${esc(n.id)}">
        <div class="num">${num}</div>
        <div class="t-title">${cover(n.id)}<div><b>${esc(n.title)}${n.favorite ? `<span class="fav">${icon("heart", 12).replace('fill="none"', 'fill="currentColor"')}</span>` : ""}</b><small>${esc(n.id)}</small></div></div>
        <div class="cell artist">${esc(n.artist)}</div>
        <div class="cell album">${esc(n.album)}</div>
        <div class="cell dur">${fmt(n.duration)}</div>
        <button class="icon-btn" data-menu="row" data-id="${esc(n.id)}" title="More">${icon("more")}</button>
      </div>`;
  }).join("");

  body.innerHTML = `
    <div class="t-row th"><div>#</div><div>TITLE</div><div class="artist">ARTIST</div><div class="album">ALBUM</div><div>DURATION</div><div></div></div>
    ${rows}`;
}

function emptyState() {
  return `<div class="empty">Your playlist is empty.<br>
    <button class="btn btn-primary btn-sm" data-act="add">${icon("plus")} Add song</button>
    <button class="btn btn-ghost btn-sm" data-act="sample">Load sample songs</button></div>`;
}

function renderStorage() {
  const n = list.getSize();
  $("#storageBar").style.width = `${Math.min(100, (n / CAPACITY) * 100)}%`;
  $("#storageText").textContent = `${n} song${n === 1 ? "" : "s"} in this playlist`;
}

function renderAll() {
  renderNav();
  renderHero();
  renderNow();
  renderTracks();
  renderStorage();
  hydrateIcons();
  save();
}

// ---------- playlist actions (each calls the circular list) ----------
function touch() { state.updated = Date.now(); }

function playNode(node) {
  if (!node) return;
  state.elapsed = 0;
  state.playing = true;
  renderAll();
}
function doNext() {
  if (list.isEmpty()) return toast("Playlist is empty");
  const wasLast = list.isLast(list.getCurrent());
  list.next();
  if (wasLast) toast("Reached the last song, looping back to the first");
  state.elapsed = 0;
  renderAll();
}
function doPrev() {
  if (list.isEmpty()) return toast("Playlist is empty");
  const wasFirst = list.getCurrent() === list.head;
  list.prev();
  if (wasFirst) toast("Went back from the first song to the last");
  state.elapsed = 0;
  renderAll();
}
function doRepeat() {
  if (list.isEmpty()) return toast("Playlist is empty");
  list.repeat();
  toast("Playlist repeated from the first song");
  playNode(list.getCurrent());
}
function doToggle() {
  if (list.isEmpty()) return toast("Add a song first");
  state.playing = !state.playing;
  renderAll();
}
function removeSong(query) {
  const cur = list.getCurrent();
  const removed = list.removeById(query) || list.removeByTitle(query);
  if (!removed) return toast("Song not found");
  if (!list.getCurrent() || list.getCurrent() !== cur) state.elapsed = 0;
  if (list.isEmpty()) state.playing = false;
  touch();
  toast(`Removed: ${removed.title}`);
  renderAll();
}
function loadSamples() {
  const samples = [
    ["TRK-01", "Midnight City", "M83", "Hurry Up, We're Dreaming", "4:03"],
    ["TRK-02", "Electric Feel", "MGMT", "Oracular Spectacular", "3:49"],
    ["TRK-03", "The Less I Know The Better", "Tame Impala", "Currents", "3:36"],
    ["TRK-04", "Intro", "The xx", "xx", "2:07"],
    ["TRK-05", "Borderline", "Tame Impala", "The Slow Rush", "3:58"],
    ["TRK-06", "Sunset Lover", "Petit Biscuit", "Presence", "3:58"],
  ];
  let added = 0;
  samples.forEach(([id, t, a, al, d]) => {
    try { list.add(id, t, a, al, parseDuration(d)); added++; } catch (e) { /* already there */ }
  });
  if (added) touch();
  toast(added ? `Added ${added} sample songs` : "Sample songs already loaded");
  renderAll();
}
function openAdd() {
  $("#addForm").reset();
  $("#fId").value = nextId();
  $("#addDialog").showModal();
  $("#fTitle").focus();
}

// ---------- menus ----------
const menu = $("#menu");
function openMenu(btn, type) {
  let items = "";
  if (type === "row") {
    const node = list.findById(btn.dataset.id);
    if (!node) return;
    items = `
      <button data-act="row-play" data-id="${esc(node.id)}">${icon("play", 14)} Play</button>
      <button data-act="row-fav" data-id="${esc(node.id)}">${icon("heart", 14)} ${node.favorite ? "Remove favorite" : "Add to favorites"}</button>
      <button class="danger" data-act="row-remove" data-id="${esc(node.id)}">${icon("trash", 14)} Remove</button>`;
  } else {
    items = `
      <button data-act="sample">${icon("music", 14)} Load sample songs</button>
      <button class="danger" data-act="clear">${icon("trash", 14)} Clear playlist</button>`;
  }
  menu.innerHTML = items;
  menu.hidden = false;
  const r = btn.getBoundingClientRect();
  const w = menu.offsetWidth, h = menu.offsetHeight;
  menu.style.left = `${Math.max(8, Math.min(window.innerWidth - w - 8, r.right - w))}px`;
  const below = r.bottom + 6;
  menu.style.top = `${below + h > window.innerHeight ? Math.max(8, r.top - h - 6) : below}px`;
}
const closeMenu = () => { menu.hidden = true; };

// ---------- events ----------
document.addEventListener("click", (e) => {
  const menuBtn = e.target.closest("[data-menu]");
  if (menuBtn) {
    e.stopPropagation();
    if (!menu.hidden) { closeMenu(); }
    else openMenu(menuBtn, menuBtn.dataset.menu);
    return;
  }

  const actEl = e.target.closest("[data-act]");
  if (actEl) {
    const id = actEl.dataset.id;
    closeMenu();
    switch (actEl.dataset.act) {
      case "toggle": return doToggle();
      case "next": return doNext();
      case "prev": return doPrev();
      case "repeat": return doRepeat();
      case "mute": state.muted = !state.muted; return renderNow(), hydrateIcons();
      case "add": return openAdd();
      case "sample": return loadSamples();
      case "clear":
        if (!list.isEmpty() && confirm("Remove all songs from the playlist?")) {
          list.clear(); state.playing = false; state.elapsed = 0; touch(); renderAll();
        }
        return;
      case "row-play": list.goTo(id); return playNode(list.getCurrent());
      case "row-fav": list.toggleFavorite(id); touch(); return renderAll();
      case "row-remove": return removeSong(id);
    }
  }

  if (!e.target.closest("#menu")) closeMenu();

  const nav = e.target.closest(".nav-item");
  if (nav) {
    state.view = nav.dataset.view;
    return renderAll();
  }

  const seek = e.target.closest("#seek");
  if (seek && list.getCurrent()) {
    const r = seek.getBoundingClientRect();
    state.elapsed = Math.floor(((e.clientX - r.left) / r.width) * list.getCurrent().duration);
    return updateProgress();
  }

  const group = e.target.closest("[data-group]");
  if (group) {
    state.view = "playlist";
    state.query = group.dataset.group;
    $("#searchInput").value = state.query;
    return renderAll();
  }

  const row = e.target.closest(".t-row[data-id]");
  if (row) {
    list.goTo(row.dataset.id);
    return playNode(list.getCurrent());
  }
});

$("#playAllBtn").addEventListener("click", () => {
  if (list.isEmpty()) return toast("Add a song first");
  list.repeat(); // start from the first song
  state.query = ""; $("#searchInput").value = "";
  playNode(list.getCurrent());
});
$("#heroAddBtn").addEventListener("click", openAdd);
$("#addBtn").addEventListener("click", openAdd);
$("#removeBtn").addEventListener("click", () => { $("#removeForm").reset(); $("#removeDialog").showModal(); $("#rQuery").focus(); });
$("#filterBtn").addEventListener("click", () => $("#searchInput").focus());
$("#bellBtn").addEventListener("click", () => toast("No new notifications"));
$("#playlistName").addEventListener("click", () => {
  const n = prompt("Rename playlist:", state.name);
  if (n && n.trim()) { state.name = n.trim(); renderAll(); }
});

// Search box: filters while typing; Enter jumps straight to a song by ID or title.
$("#searchInput").addEventListener("input", (e) => {
  state.query = e.target.value;
  renderTracks();
  hydrateIcons();
});
$("#searchInput").addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const q = e.target.value.trim();
  if (!q) return;
  const node = list.goTo(q);
  if (!node) return toast("No song with that ID or title");
  toast(`Jumped to: ${node.title}`);
  playNode(node);
});

// Dialogs
$$("dialog [data-close]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));
$("#addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    const node = list.add($("#fId").value.trim(), $("#fTitle").value.trim(), $("#fArtist").value.trim(), $("#fAlbum").value.trim(), parseDuration($("#fDur").value.trim()));
    touch();
    $("#addDialog").close();
    toast(`Added: ${node.title}`);
    renderAll();
  } catch (err) {
    toast(err.message);
  }
});
$("#removeForm").addEventListener("submit", (e) => {
  e.preventDefault();
  $("#removeDialog").close();
  removeSong($("#rQuery").value.trim());
});

// Simulated playback: one tick per second, auto-advances (and wraps) through the circular list.
setInterval(() => {
  const cur = list.getCurrent();
  if (!state.playing || !cur) return;
  state.elapsed++;
  if (state.elapsed >= cur.duration) {
    const wasLast = list.isLast(cur);
    list.next();
    state.elapsed = 0;
    if (wasLast) toast("Playlist finished, looping back to the first song");
    renderAll();
  } else {
    updateProgress();
  }
}, 1000);

load();
hydrateIcons();
renderAll();
