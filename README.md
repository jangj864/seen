# SEEN — Issue 02 / November 2026

A responsive, buildless digital film publication extending Jinhyeok Jang’s SEEN Issue 01 print identity. Theme: **A Seat at the Table** — family, belonging, memory, and coming home.

## Cinema draft

The entry page is an interactive isometric cinema lobby drawn with Canvas 2D. Walk using arrows/WASD, click the floor, or use mobile controls. Lobby doors swing open on approach; crossing a doorway automatically enters its room. Click a door to walk through it. Returning from an auditorium places the visitor outside the threshold to prevent immediate re-entry. Both walking canvases suppress the red focus border. Four screening doors open walkable isometric auditoriums with a large program screen, 50 seats, wall sconces, and aisle lighting. Use arrows/WASD, click a floor destination, or use mobile controls. Click a chair or choose a seat to follow the aisle and sit; Enter sits or stands near a chair. Walking uses eased movement, direction changes, and alternating limb motion. Sitting and standing animate through the front of the seat, with bent knees and the selected seat preserved while reading. The auditorium right wall and its floating wall lights are removed. The screen has a dark stage wall, red velvet side curtains with gold ties, an upper valance, and a low stage. The walking canvas does not show the red focus border. A rear EXIT doorway automatically returns the visitor to the same room’s lobby entrance on crossing its threshold. Click the doorway or EXIT button to walk there, including standing up first if seated. Seat selections remain per room during the visit. The lobby floor has no red guide lines. Each room’s screen opens only its assigned article in a native reading popup: cover story, Lady Bird, After Yang, or Minari. No full magazine navigation or iframe appears in the popup. Closing it preserves the visitor’s position and seated state; readers can return to their seat or the lobby; The Program offers room selection. The original publication remains at `magazine.html`. The five lobby-wall posters open film details with synopsis, US release date, director, studio, and an official film/trailer link. Artwork and metadata use official distributor sources; the Focker-In-Law portrait poster is from Universal’s official film site, Ebenezer from Paramount, and Godzilla Minus Zero from GKIDS. Five evenly spaced posters alternate with four entrances on an expanded rear wall. The lobby and auditoriums share `character.js` for the same visitor proportions, directional turning, gait, and limb animation. Lobby movement also eases into and out of each step. Both spaces accept arrows and physical WASD keys, including uppercase and Korean input mode, even after a button receives focus. Article popups pause movement; typing and native seat selection retain their normal keyboard behavior. No rendering dependencies or WebGL required.

## Game Room

A green doorway on the left of the lobby opens on approach and automatically launches SEEN Quiz when crossed. Click the door or choose The Game Room in The Program to walk there. Three arcade cabinets offer ten-question director, actor-eye and film-trivia rounds, with answer explanations, shared Top 10 results, replay, and return to the lobby. Progress is preserved during the current visit.

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

## Arcade high scores

Each of the three ten-question quizzes shows a shared Top 10 after completion, using the nickname entered on the admission ticket. The best score per nickname and quiz is ranked first; equal scores use the time that record was achieved. Replaying starts a new run; reopening a result or changing language keeps the same run id and does not submit again. Empty positions remain empty.

`quiz-scores.js` submits ten answer choices to `public.seen_quiz_scores_v2`; the database derives the score and supplies its own timestamp. Public clients can insert only run id, nickname, mode and choices, and can read public ranking fields. They cannot change scores, timestamps or existing records. The invoker RPC `seen_quiz_leaderboard_v2` returns the Top 10 and the current nickname's best rank, including ranks below 10. Schema reference: `backend/seen-quiz-scores-v2.sql`. The original five-question table and RPC remain intact for legacy records and cached older clients; ten-question rounds use their own rankings. The SQL verification fixtures roll back all test records. `scoreboard.js` and `arcade-experience.css` supply the shared retro result view, including loading, retry and narrow-screen scrolling.

## Entry, NPC conversations, and pixel arcade

Visitors enter a 2–20 character nickname through a loading/onboarding ticket before joining live presence. Names appear above avatars. Ticket and popcorn staff offer conversations; seated NPCs can accept or decline seat requests. Live visitors receive a Yes/No request and only move after accepting. Auditorium guests face the screen; the lobby bench guest faces the open side of the bench.

Quiz panels use a local Press Start 2P font (OFL license in `dist/assets/`) and pixel borders, cards, progress indicators, and CRT styling. Responsive question/feedback regions preserve panel height before and after answers. The compact CRT playfield removes the side marquee and segmented progress bar, keeping questions and answer cards together. Validation covered all 30 questions at four viewport sizes, NPC Yes/No responses, live visitor request/reply, and navigation/jump tests.

NPC identities appear within interaction range. Approach and click/tap a character for an anchored, non-modal dialogue bubble with branching choices. A distant click approaches the character without opening dialogue. The speaker pauses and faces the visitor during the conversation, then resumes walking without snapping to a new position. Staff wear red uniforms, cream aprons and caps. The red arcade machine has no foreground NPC. Walking guests turn with their travel direction and use a faster walking cycle. Shared crowd navigation adds standing-person footprints to click routes and manual collision checks, including the lobby planter; moving guests pause rather than cross the local visitor.

## Korean and English

The language buttons in the welcome ticket, header, and reading/game dialogs switch between English and Korean. `seen-language` stores the preference locally and carries it between the cinema and magazine. English remains the default. `i18n-data.js` contains the translations, including the four full screening articles; `i18n.js` translates static and newly rendered UI without restarting a quiz, moving an avatar, or rebuilding comment forms. Visitor names, submitted reader comments, and form values remain as written. Original film artwork and brand names are retained. Canvas labels use the same translator and redraw on a language change. Korean typography uses locally hosted Pretendard, Noto Serif KR accents, and a Korean pixel font in the arcade.

Validation covered switching an answered quiz in both directions without changing its score, switching article languages while retaining an unsubmitted comment, preference continuity into the magazine, and Korean quiz/layout checks at phone, tablet, desktop, and landscape sizes. Run `node --test tests/*.test.cjs` for localization and navigation/jump checks.

## Mobile navigation and reading continuity (November 2026)

A shared mobile camera enlarges the walking scenes and offers an Overview / Follow toggle. Projection, nameplates and pointer hits use the same camera; touch doors and people have expanded targets. Visible screening controls provide article reading, seat selection and return to the lobby, while the arcade offers three keyboard-accessible cabinet buttons. Native buttons and selects retain their standard Space/Enter/arrow behavior.

Cinema articles support `#read/table`, `#read/ladybird`, `#read/yang` and `#read/minari` links. Within an active reading visit, browser Back/Forward closes and restores the article. Returning home starts a new visit: older article entries cannot reopen a story, including when an admitted document is restored from the browser cache. Direct article links and article refreshes still work. Reading position and exact unposted comment drafts are kept per article in this tab, including reloads when session storage is available. Successful posting clears only the matching draft; failures and newer replacement drafts are retained. Background poster loading no longer blocks admission. Reading type is 16px on narrow screens and 18px on larger screens.

`film-catalog.js` supplies the five upcoming films to both editions, and `articles.js` supplies their shared essays. Recommendation PNGs wrap long Korean and Latin strings without clipping. Conversation sessions reject stale async seat replies after a conversation closes or changes.

Validation: `node --test tests/*.test.cjs`. Browser regressions: `PLAYWRIGHT_MODULE=/absolute/path/to/playwright node --test --test-concurrency=1 tests/*.browser.cjs` (Chrome). Browser fixtures replace backend services and never publish public comments or scores.

## Cinema controls

The cinema uses the original isometric canvas style throughout the lobby, screening rooms and arcade. Language buttons use **KR / EN**. Sound uses a speaker icon with an accessible on/off state. On small screens the introduction wraps inside the viewport. Arcade leaves open inward, and nameplates use a foreground layer anchored to each character’s head.

`quiz-player.js` provides the existing questions, answers, replay and Top 10 scoreboard. Completed rounds retain the visitor’s nickname across score retries.

## Refresh recovery

The cinema and magazine validate saved ballot, watchlist, card and article data before restoring it. A malformed entry cannot stop startup or discard another article’s valid draft. With blocked browser storage, reading progress and drafts remain available for the current visit.

Presence and quiz results reuse the same Supabase client. Movement updates serialize at most once per 120 ms, and unchanged positions are not broadcast again. Optional presence notifications and AudioContext resume failures are handled without interrupting comments or navigation.

`tests/refresh-recovery.browser.cjs` covers repeated refreshes at mobile and desktop widths, all four article routes, malformed links and stored data, missing artwork, blocked storage, shared connections and audio failures. It uses local backend fixtures and never writes public comments or scores. Run browser checks with `PLAYWRIGHT_MODULE=/path/to/playwright node --test --test-concurrency=1 tests/*.browser.cjs` and unit checks with `node --test tests/*.test.cjs`.

The Publish SEEN workflow runs unit, shipped-script syntax and local-resource checks before uploading the site, so these failures stop deployment.

## Arcade cabinet interface

All three quizzes use the same front-facing cabinet, inset CRT playfield, answer cards and Top 10 result screen. Each game retains its own accent color and pixel icon; question text and answer names use readable Korean/Latin typography. Choose with the cards, A–D, 1–4, or the cabinet’s physical-style answer buttons on desktop. Those buttons and keyboard shortcuts call the same answer action and cannot submit twice.

`arcade-experience.css` owns the cabinet, confirmation and scoreboard styling. `tests/arcade-cabinet.browser.cjs` completes every mode in Korean and English at four viewport sizes, checking card text bounds, feedback, a fixed screen frame, nickname preservation and one score submission per round. Its backend is local test data.

## Cinema projection interface

The wall projection and reading view use the same film still and article title with black masking, a matte screen texture, restrained lighting and dark velvet curtains. `cinema-experience.css` owns the reading frame and transition styling; shared scene controls remain in `experience.css`. The 16:9 title card fills one screen, and the introduction, article and comments scroll inside that fixed surface. Image credits remain visible on the title card.

The wall’s tiny perforation texture is cached per drawing context, including the transition snapshot. Curtain opening never scales the wall screen. Browser checks cover both languages, title/credit bounds, internal scrolling, draft restoration and motion cancellation.

## General cinema quiz expansion

Each cabinet has ten questions: film directors, actors identified by eye details, and film stories/characters. The selection combines SEEN editorial films with widely known cinema, including Inception, Titanic, Star Wars, Harry Potter, Toy Story, The Matrix and The Lord of the Rings. `quiz-data.js` keeps source URLs alongside the new question notes, and `i18n-data.js` supplies Korean questions, options and explanations.

The nine actor portrait photographs are locally hosted under the Creative Commons licenses listed in `assets/quiz-photo-credits.json` and `quiz-credits.html`, linked from the eye cabinet. Full photographs remain intact; nested SVG viewports fit each complete eye pair and hide the rest of the face at all screen ratios. Four unsuitable stills were replaced with clear portraits. The remaining Saoirse Ronan still is credited to A24. Browser checks verify the actual image dimensions and complete crop bounds for all ten questions in both languages at four viewport sizes.

The ten-question database contract derives all scores on the server, accepts only ten valid choices, and keeps the original five-question scores intact. `backend/seen-quiz-scores-v2.test.sql` verifies ten-point scoring, best scores, ties, separate modes, Top 10 ranks and anonymous permissions inside a rolled-back transaction. No QA rankings are published.

## Scene lifecycle and rendering cost

`createSeenSceneLoop` schedules only the visible walking scene and cancels its pending frame when the scene or browser tab becomes hidden. Showing the scene resumes its existing movement state with one frame loop. Camera tools, seat controls and nameplate layers update their DOM attributes and styles only when values change. In the regression fixture, 60 displayed frames previously ran 180 scene callbacks; they now run 60, without changing the visible frame rate.

Pending seat handoffs belong to their original room visit. Leaving, entering another auditorium, choosing another destination or moving manually cancels retries so an old acceptance cannot move the visitor later. Valid handoffs still wait for the occupant to leave before walking to the seat. `tests/performance-lifecycle.browser.cjs` verifies callback counts, stable layout attributes, tab visibility, cancelled handoffs and successful handoffs using local fixtures.

## Portrait posters and Korean film copy

All eight film listings use portrait poster artwork, with complete images fitted inside 2:3 frames in the program, film details and magazine. The isometric wall uses the same proportions and a separate date strip. No poster is stretched or trimmed on hover. Article stills remain separate from the portrait poster assets. `assets/film-poster-sources.json` records the artwork sources.

`film-catalog.js` keeps Korean titles and original synopsis adaptations alongside the canonical English records. Localization registers those same translations in every view. The confirmed Korean release titles for The Hunger Games: Sunrise on the Reaping and Hexed replace the previous literal translations. Upcoming films whose Korean release titles were not confirmed use clearly labelled transliterations in the Korean detail view. The magazine's saved ballot values and watchlist ids remain compatible with existing browser data.

`tests/poster-localization.browser.cjs` checks the wall's image transforms, all five film-detail views, all eight magazine posters and synopses, and KR/EN switching at phone, landscape and desktop sizes. Set `SEEN_SCREENSHOT_DIR` to an existing directory to save visual QA screenshots.

## Compact room layout and touch recovery

`scene-layout.css` gives compact auditoriums and arcades separate rows for guidance, the map and a control dock. Both rooms start with a complete map view; visitors can switch to following their character. The map canvas, name layer, screen capture and pointer coordinates share the same viewport. Short landscape screens keep the touch controls beside the actions, while portrait screens use smaller controls below them. Seat selection uses 16px text to avoid Safari's automatic form zoom.

`world-camera.js` fits the room's floor and walls inside that viewport and skips bitmap allocation for unchanged or hidden canvases. Touch controls release captured pointers and held directions when a dialog opens, the scene changes, the viewport resizes or the app loses focus. `tests/mobile-scene-layout.browser.cjs` checks Chrome and WebKit at six phone, landscape and tablet sizes, including toolbar-height changes, rotation, article clicks and interrupted two-finger input. Browser checks require the installed Playwright Chrome and WebKit runtimes; local fixtures do not publish scores or comments.
