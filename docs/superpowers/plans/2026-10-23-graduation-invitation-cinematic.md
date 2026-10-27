# Cinematic Graduation Invitation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the invitation as a responsive Vite site with a tactile Three.js takeover scene, a restrained double heartbeat, and a plane that climbs, releases a boarding pass, and leaves it floating down into the invitation.

**Architecture:** Use one continuously rendered Three.js scene with a perspective camera, depth-layered telemetry, a beveled warning plate, pulsing warning lights, a lightweight metallic aircraft, and soft smoke particles. Keep all copy, buttons, mascot, animated boarding pass, details, and RSVP feedback in semantic HTML/SVG; a small state controller synchronizes the scene and DOM through intro → alert → character → pull → reveal → flight → ticket → details.

**Tech Stack:** Vite, JavaScript modules, Three.js, CSS, semantic HTML.

**Spec:** `docs/superpowers/specs/2026-10-23-graduation-invitation-cinematic-design.md`

## Global Constraints

- Keep the takeover clearly fictional and do not imply device access.
- Preserve start, skip, replay, ticket, guest query parameter, and on-screen RSVP feedback.
- Keep date, time, and venue as “Sẽ cập nhật”; do not invent event details or persist RSVP.
- Keep essential copy as HTML and provide a reduced-motion route to the invitation.
- Use one WebGLRenderer and one animation loop; cap pixel ratio and scene load on mobile.
- The flight beat has a clear release point: the aircraft climbs diagonally with soft trailing smoke, releases the boarding pass, and the pass glides/rotates gently into its settled position with an aircraft and route printed on it.
- The takeover remains a continuous 3D scene: camera dolly/pan and depth parallax animate between state transitions, while the live HTML warning surface stays aligned to the Three.js metal/glass plate.
- Do not add audio, external services, or a UI framework.

## Review Focus

- A `guest` query containing markup is rendered as text; inspect the DOM in the browser with an encoded `<img>` value.
- WebGL initialization failure leaves the HTML invitation and controls usable; inspect by forcing renderer creation to fail.
- Reduced motion opens the invitation without running the cinematic sequence; inspect with browser emulation.
- A narrow 390×844 viewport keeps alert copy and ticket controls readable without mascot overlap; inspect screenshots.
- Flight motion and smoke appear in the browser, and the ticket aircraft/route remain legible on mobile.
- Replaying midway through a sequence does not leave stale timers, confetti, or animation; inspect the start/skip/replay flow.

---

### Task 1: Create the Vite invitation shell

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `src/main.js`
- Create: `src/styles.css`

**Interfaces:**
- `index.html` exposes the scene and interaction IDs: `app`, `sceneCanvas`, `skip`, `start`, `log`, `warning`, `actor`, `bubble`, `ticketGuest`, `acceptTicket`, `details`, `detailGuest`, `yes`, `maybe`, `feedback`, `replay`, and `announcer`.
- `src/main.js` owns `setScene(name, message)`, `play()`, `ready()`, `reset()`, and RSVP feedback; guest text is assigned with `textContent`.

- [x] Create the Vite scripts and dependencies in `package.json`, and the semantic Vietnamese invitation structure in `index.html` with the graduate mascot and current placeholder event copy.
- [x] Implement the state controller and cancellable timeline in `src/main.js`; reduced motion goes directly to the ticket.
- [x] Implement the responsive intro, warning overlay, mascot, ticket, details, focus styles, and reduced-motion styles in `src/styles.css`.

### Task 2: Build and connect the Three.js cinematic scene

**Files:**
- Create: `src/scene.js`
- Modify: `src/main.js`
- Modify: `index.html`
- Modify: `src/styles.css`

**Interfaces:**
- `createCinematicScene({ canvas, warning, app })` returns `{ setPhase(name), update(timeMs), resize(), dispose() }`.
- `update(timeMs)` drives one render loop, screen-space alignment of the 3D plate, heartbeat lights, and the synchronized pull transform.

- [x] Build one capped-pixel-ratio `WebGLRenderer`, perspective camera, depth-layered telemetry, dark fog, brushed-metal warning body, inset glass, fasteners, red emitters, lightweight aircraft geometry, and a smoke particle system in `src/scene.js`.
- [x] Animate a soft double pulse once per second; expose phase transitions for alert entrance, mascot arrival, delayed plate pull, and warm ticket reveal.
- [x] Connect resize, visibility, and page-hide lifecycle; reduce rain density and perspective on mobile, stop rendering while hidden, and preserve HTML usability if WebGL is unavailable.

### Task 3: Integrate and review the finished experience

**Files:**
- Modify: `src/main.js`
- Modify: `src/scene.js`
- Modify: `src/styles.css`

- [x] Synchronize typed terminal lines, scene phases, mascot arm pose, pull, warmth, aircraft climb, smoke, ticket release/floating landing, and confetti with cancellable timers.
- [x] Add an accessible decorative aircraft and animated flight-path mark to the HTML boarding pass.
- [x] Run `npm run build` and resolve any build errors.
- [x] Open the Vite page in a browser at desktop and 390×844; visually review intro, warning heartbeat, aircraft smoke/release, ticket landing, printed plane, and details, then adjust layout or motion issues found.
- [x] Manually inspect the key visual flow, mobile layout, reduced-motion route, replay/skip wiring, and details handoff; no automated test suite added for this request.
- [x] Refine the takeover after visual feedback: replace generic hacker copy with a flight-navigation override, make the warning plate reveal procedural brushed metal and visible hardware, add a living camera/perspective movement with heartbeat response, limit matrix-like text to the intrusion beat, and honor reduced-motion changes during playback.
- [x] Rewrite the warning for a non-IT recipient: say “BẠN ĐÃ BỊ HACK!” plainly, reassure them in everyday Vietnamese that the phone is safe, and lead into the graduation invitation.
