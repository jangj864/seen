# SEEN — Issue 02 / November 2026

A responsive, buildless digital film publication extending Jinhyeok Jang’s SEEN Issue 01 print identity. Theme: **A Seat at the Table** — family, belonging, memory, and coming home.

## Cinema draft

The entry page is an interactive isometric cinema lobby drawn with Canvas 2D. Walk using arrows/WASD, click the floor, or use mobile controls. Lobby doors swing open on approach; crossing a doorway automatically enters its room. Click a door to walk through it. Returning from an auditorium places the visitor outside the threshold to prevent immediate re-entry. Both walking canvases suppress the red focus border. Four screening doors open walkable isometric auditoriums with a large program screen, 50 seats, wall sconces, and aisle lighting. Use arrows/WASD, click a floor destination, or use mobile controls. Click a chair or choose a seat to follow the aisle and sit; Enter sits or stands near a chair. Walking uses eased movement, direction changes, and alternating limb motion. Sitting and standing animate through the front of the seat, with bent knees and the selected seat preserved while reading. The auditorium right wall and its floating wall lights are removed. The screen has a dark stage wall, red velvet side curtains with gold ties, an upper valance, and a low stage. The walking canvas does not show the red focus border. A rear EXIT doorway automatically returns the visitor to the same room’s lobby entrance on crossing its threshold. Click the doorway or EXIT button to walk there, including standing up first if seated. Seat selections remain per room during the visit. The lobby floor has no red guide lines. Each room’s screen opens only its assigned article in a native reading popup: cover story, Lady Bird, After Yang, or Minari. No full magazine navigation or iframe appears in the popup. Closing it preserves the visitor’s position and seated state; readers can return to their seat or the lobby; The Program offers room selection. The original publication remains at `magazine.html`. The five lobby-wall posters open film details with synopsis, US release date, director, studio, and an official film/trailer link. Artwork and metadata use official distributor sources; the Focker-In-Law portrait poster is from Universal’s official film site, Ebenezer from Paramount, and Godzilla Minus Zero from GKIDS. Five evenly spaced posters alternate with four entrances on an expanded rear wall. The lobby and auditoriums share `character.js` for the same visitor proportions, directional turning, gait, and limb animation. Lobby movement also eases into and out of each step. Both spaces accept arrows and physical WASD keys, including uppercase and Korean input mode, even after a button receives focus. Article popups pause movement; typing and native seat selection retain their normal keyboard behavior. No rendering dependencies or WebGL required.

## Game Room

A green doorway on the left of the lobby opens on approach and automatically launches SEEN Quiz when crossed. Click the door or choose The Game Room in The Program to walk there. The arcade-style dialog uses eight quiz questions, including two actor eye-detail questions, with answer explanations, score, result, replay, and return to the lobby. Progress is preserved during the current visit.

## Preview

Run `python3 -m http.server 4173 --directory dist`, then open http://localhost:4173.

## Contents

- Cover story and three complete critical essays in accessible reading dialogs, with direct article links.
- November 2026 release previews with official distributor links; separate revisits filter.
- Browser-local watchlist and shared-screen ballot. Repeat names update their existing vote.
- Six-question quiz with answer explanations and restart.
- Personal recommendation card with a shareable URL, clipboard fallback, and downloadable PNG.
- Source register, image credits, colophon, keyboard navigation, responsive layouts, reduced-motion support.

Film assets are sourced from official distributor publicity pages and the user-supplied Issue 01 PDF. See the in-publication Sources & credits for individual attribution. Critical articles are AI-assisted editorial drafts, not attributed personal experiences. Browser storage is optional; features continue for the current visit if unavailable. Sharing is initiated by the reader. Shared card text is carried in the URL fragment.

Static output: `dist/`. No build or server dependencies.

## Public hosting

GitHub Pages publishes `dist/` automatically whenever changes are pushed to `main`. Workflow: `.github/workflows/pages.yml`.

The quiz blackboard has a fixed height and a reserved answer area, so feedback never resizes the board. Publicity stills for the eye questions are credited to A24.

## Working folder

Use `/Users/ddoazoo/Documents/GitHub/seen` as the only project folder. Edit site files in `dist/`; `.github/workflows/pages.yml` publishes them on pushes to `main`.

Repository: https://github.com/jangj864/seen

Live site: https://jangj864.github.io/seen/

## Shared cinema (October 2026 update)

The lobby offers **Upcoming films**. Hovering or approaching a screening-room door updates the NOW SHOWING article panel; clicking the door walks directly into the screening. Posters identify upcoming films and open the film-detail dialog.

`community.js` adds clearly labelled NPC hosts, a staffed ticket booth, a popcorn counter, seated auditorium visitors, and live visitors. Live avatars use a Supabase Presence channel (`seen-cinema-v1`) for membership and throttled Broadcast messages for movement; each auditorium is a separate scene (`screen-01` through `screen-04`). NPCs are never included in the live visitor count. Motion respects reduced-motion preferences. The mobile thumbstick, touch-floor navigation, and desktop controls remain available.

Public guest comments appear below each article. They persist in **only** `public.seen_comments` on the existing `unicorn-vs-dragon` project, with independent RLS policies, length/article checks, link rejection, and a 30-second per-visitor posting limit. Public clients can read and insert, but cannot update or delete. The visitor rate limit is a basic guest control, not authenticated identity verification. Moderate/remove comments through the Supabase dashboard. No fabricated reader comments are seeded. The applied schema is recorded in `backend/seen-comments.sql`; it is not a script to run repeatedly.

`community-config.js` contains the project URL and browser-safe publishable key. Never put a service-role/secret key in this file. The browser SDK is vendored at **@supabase/supabase-js 2.118.0** with its MIT license in `dist/vendor/`. Existing project tables, RPCs, auth configuration, and data were not changed.

**Sound off/on** starts/stops locally synthesized room ambience after an explicit user gesture. The lobby, screening room, and arcade use different low-volume sound patterns; quizzes add answer sounds. Background tabs suspend audio. No sound files, microphone, or autoplay permissions are required.

Validation included two independent browser contexts for live presence/movement, comment sharing and persistence after reload, API tests for comment constraints and denied update/delete, mobile multi-touch movement/jump in all rooms, stable/unclipped quizzes at 320×568, 393×852, 844×390, and 1440×900, and the existing navigation/jump unit suite. Test comments were removed after verification.

## Entry, NPC conversations, and pixel arcade

Visitors enter a 2–20 character nickname through a loading/onboarding ticket before joining live presence. Names appear above avatars. Ticket and popcorn staff offer conversations; seated NPCs can accept or decline seat requests. Live visitors receive a Yes/No request and only move after accepting. Auditorium guests face the screen; the lobby bench guest faces the open side of the bench.

Quiz panels use a local Press Start 2P font (OFL license in `dist/assets/`) and pixel borders, cards, progress indicators, and CRT styling. Responsive question/feedback regions preserve panel height before and after answers. The compact CRT playfield removes the side marquee and segmented progress bar, keeping questions and answer cards together. Validation covered all 15 questions at four viewport sizes, NPC Yes/No responses, live visitor request/reply, and navigation/jump tests.

NPC identities appear within interaction range. Click a character or press Enter nearby for an anchored, non-modal dialogue bubble with branching choices. Staff wear red uniforms, cream aprons and caps. The red arcade machine has no foreground NPC. Walking guests turn with their travel direction and use a faster walking cycle. Shared crowd navigation adds standing-person footprints to click routes and manual collision checks, including the lobby planter; moving guests pause rather than cross the local visitor.
