# Looplist: Music Playlist Manager (Project 8)

A playlist manager with a dashboard UI, built on a **doubly circular linked list**. Plain HTML, CSS and JavaScript, so there is no backend or build step.

## Run it
- Open `index.html` in a browser, or right-click it in VS Code and choose **Open with Live Server** (Go Live).
- Data-structure tests: `node test.js`

## Deploy (free, ~1 minute)
- **Netlify Drop:** https://app.netlify.com/drop, then drag this folder in.
- **GitHub Pages:** push to a repo, then Settings → Pages → deploy from `main` / root.
- **Vercel:** `npx vercel` inside the folder (framework: Other).

## Files
| File | Purpose |
|---|---|
| `circularList.js` | The circular linked list (`SongNode`, `PlaylistCircularList`) |
| `app.js` | UI: calls the list's methods and renders the dashboard |
| `index.html`, `style.css` | Looplist interface |
| `test.js` | Node tests for the list |

## How the circular linked list works
Each `SongNode` stores `id, title, artist, album, duration, favorite, next, prev`.
The list keeps `head` (first song), `current` (selected song) and `size`.
The last node's `next` points to `head`, and `head.prev` points to the last node, so there is no `null` at either end.

| Requirement | Method | Where in the UI |
|---|---|---|
| Add song | `add()` (O(1): tail is `head.prev`) | "Add song" button |
| Remove by ID / title | `removeById()`, `removeByTitle()` | "Remove song" button, or the ⋯ menu on a row |
| Display all | `toArray()` (loops until it returns to `head`) | Playlist tracks table |
| Next song | `next()` (last → first) | ⏭ button |
| Previous song | `prev()` (first → last) | ⏮ button |
| Jump by title / ID | `goTo()` | Type in the search box and press Enter, or click a row |
| Repeat playlist | `repeat()` | 🔁 button, "Play all", and automatic loop at the end |
| Current song + total | `getCurrent()`, `getSize()` | "Now playing" card and "Total tracks" |

Extras: the "Now playing" card shows the current node's `prev` and `next` links, the **Queue** page lists songs in circular order from the current one, and Favorites, Artists and Albums pages are built from the same list. Playback is simulated with a timer (no audio) and auto-advances, looping from the last song back to the first. Songs are saved in `localStorage`.

## Complexity
Add O(1) · Next/Prev O(1) · Search/Remove/Display O(n)
