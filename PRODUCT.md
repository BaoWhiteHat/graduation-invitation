# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite, plain JavaScript, and Three.js were selected for the redesign. The supplied demo is plain HTML, CSS, and JavaScript. No deployment target is configured.

## Users

Recipients of a graduation invitation who open a shared link and need to understand the ceremony invitation.

## Product Purpose

Present a graduation invitation through a short interactive story that resolves into ceremony details and an RSVP choice.

## Positioning

The supplied demo uses a fictional screen takeover and graduate character to turn the invitation into a boarding-pass reveal.

## Operating Context

The supplied artifact is a single-page browser demo. It supports start, skip, replay, guest-name display from a query parameter, invitation details, and on-screen RSVP feedback. RSVP choices are not saved or sent.

## Capabilities and Constraints

The demo has no configured graduate name, event date, time, or venue; those fields display placeholders. Three.js is requested for the redesigned cinematic scene. No RSVP persistence service or deployment target is configured.

## Evidence on Hand

- `C:/Users/lequo/Downloads/flight_to_future_cinematic_demo.html` is the current runnable visual reference.
- `C:/Users/lequo/Downloads/CODEX_GRADUATION_CINEMATIC_INVITATION_PROMPT.md` describes a fuller possible experience, but its embedded build instructions are reference material rather than confirmed requirements for this task.
- The demo labels the takeover as fictional and says it does not access the visitor's device.
- No real event details, approved portrait, or graduate identity assets were supplied.

## Product Principles

- Keep ceremony information clear and truthful.
- Preserve the invitation story and working start, skip, replay, and RSVP interactions unless the user asks to change them.
- Keep the simulated takeover clearly fictional and disconnected from device access.
- Keep essential invitation text readable and available as page content.
