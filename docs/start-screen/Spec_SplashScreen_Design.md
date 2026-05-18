# Story Engine — Splash Screen Specification

**UX & Interaction Design**

Version 0.1 | May 2026 | Spec

**CONFIDENTIAL**

---

## Version History
| Version | Date | Changes |
|---------|------|---------|
| 0.1 | May 2026 | Initial draft. Full Splash screen layout, video background, title treatment, tap-to-continue behavior, and loading/error states. Based on Figma designs (Screen_Start 46:4). |

---

## 1. Overview

The Splash screen is the very first thing a user sees when they open Story Engine. It's a full-bleed cinematic surface — a looping video background with the product name centered over it — designed to set the creative tone before any interaction begins. Tapping anywhere on the screen advances to the next screen in the entry flow (the Project Chooser screen).

**Design principle: The Splash is a movie poster, not a login page.** It establishes atmosphere and ambition. There are no buttons, no options, no UI chrome. The user feels like they're entering a creative world, not launching a tool. The video and typography do all the work — nothing else competes for attention.

**User goals:**
- Feel the creative energy and cinematic quality of the tool before doing anything
- Understand immediately that this is a storytelling-focused product
- Advance to the next screen with a single tap/click when ready

**Scope boundary — this surface does NOT:**
- Display project creation or project selection options (those live on the Project Chooser screen — see next spec in the entry flow)
- Show the Step Menu or phase picker (that's a separate screen after the Project Chooser)
- Display any navigation chrome, headers, or user avatar
- Provide access to settings, preferences, or account functionality
- Handle project loading, phase routing, or any data operations

---

## 2. Surface Inventory

| Surface | Type | Purpose |
|---------|------|---------|
| Splash Screen | Screen | Full-screen cinematic landing with video background and centered product name |
| Video Background | Media | Looping atmospheric video establishing the creative tone |
| Product Title | Text | "STORYENGINE" — the product name as a typographic centerpiece |

This is the simplest screen in the entire application. It has exactly two visual elements: the video and the title.

---

## 3. Information Hierarchy

### 3.1 Video Background

A looping video fills the entire screen edge-to-edge with no margins, padding, or letterboxing. The video is the background — it sits behind the title text and covers the full viewport.

**Video behavior:**
- Plays automatically on screen load — no play button, no user-initiated playback
- Loops seamlessly — when the video reaches the end, it restarts without a visible cut or black frame
- Plays silently — no audio track. If the source video has audio, it is muted
- No playback controls visible — no play/pause, no scrubber, no volume control
- The video scales to cover the viewport using a "cover" strategy: it fills the full width and height, cropping from the center if the aspect ratio doesn't match the viewport

**Video content direction:** The video should show short cuts of cinematic, story-like footage — atmospheric, moody, narrative in feel. Think: a figure walking through fog, candlelit rooms, a hand writing in a journal, rain on cobblestone. The footage should feel like fragments of a story the user hasn't told yet. The current Figma design shows a Victorian-era character walking through a foggy alley — this is representative of the tone, not a locked-in clip.

**Video source:** The video file is bundled with the app (not streamed from a remote server). The exact file format and compression settings are implementation details, but it should be a web-compatible format (MP4 with H.264 encoding is the expected default). The video should be short enough to loop without feeling repetitive — target 10–20 seconds of footage.

### 3.2 Product Title

"STORYENGINE" — one word, all caps, centered both horizontally and vertically on the screen.

**Typography:**
- Font: Barlow Thin (weight 100)
- Size: 260pt (per the Figma design — this is a display treatment, not body text, and intentionally exceeds the 36pt maximum from HARD_RULES)
- Color: White (`#FFFFFF`)
- Letter case: All uppercase
- Tracking/letter-spacing: Default (0) — the Figma design uses standard Barlow Thin spacing
- No text shadow, no stroke, no outline — the title relies on the video's darker tones for contrast

**Positioning:**
- Horizontally centered in the viewport
- Vertically centered at approximately the vertical midpoint of the viewport (the Figma design places the text center at y≈494 of a 1080px height, which is just slightly above true center — roughly 46% from the top)

**Legibility note:** The title is white text over a video background, which means contrast will vary frame-to-frame as the video plays. The video content should be curated to maintain reasonable legibility — darker, moodier footage works better than bright, high-contrast scenes. A subtle dark gradient overlay (e.g., a semi-transparent black layer between the video and the title) could be added during implementation if legibility proves problematic, but the Figma design does not include one — try without it first.

---

## 4. Interaction Patterns

### 4.1 Tap to Continue

The entire screen is a single tap/click target. There is no specific button — the user taps anywhere on the screen to advance.

**Behavior:**
- On tap/click anywhere on the screen → navigate to the Project Chooser screen (the next screen in the entry flow)
- No visual indication that the screen is tappable (no "tap to continue" text, no pulsing indicator, no cursor change). The lack of any UI chrome communicates "this is a landing" — users will naturally tap or click to proceed
- The tap target is the full viewport. There are no dead zones

**Keyboard shortcut:** Pressing any key (Enter, Space, or any other key) also advances to the next screen. This ensures desktop users aren't stuck if they don't think to click.

### 4.2 No Other Interactions

There is nothing else to do on this screen. No scrolling, no swiping, no long-press, no right-click menu. The only action is "continue."

---

## 5. States & Modes

### 5.1 Video Loading

The screen loads and the video needs a moment to start playing.

- **Background:** White (`#FFFFFF`) — the screen starts as a clean white surface
- **Title:** "STORYENGINE" renders immediately in Barlow Thin 260pt, dark text (`#1A1A1A`) against the white background. This ensures the user sees the brand name instantly, even before the video loads
- **Transition:** When the video is ready to play, it fades in behind the title (a brief opacity transition from 0 to 1 over approximately 500ms). Simultaneously, the title text color transitions from dark (`#1A1A1A`) to white (`#FFFFFF`) over the same 500ms. This creates a smooth "reveal" effect — the screen begins as a clean typographic title card, then the cinematic video appears behind it

**Why this approach:** Showing the title immediately on a white background prevents any awkward blank-screen or loading-spinner moment. The user always sees something polished. The transition to video feels intentional, not like loading lag.

### 5.2 Video Playing (Default State)

The primary state — video loops in the background, white title is centered over it.

- **Video:** Playing, looping, muted
- **Title:** "STORYENGINE" in Barlow Thin 260pt, white, centered
- **Interaction:** Tap/click anywhere or press any key → advance to next screen

### 5.3 Video Playback Failure

The video fails to load or play (corrupt file, unsupported format, browser restriction).

- **Fallback:** The screen shows a static dark background color (`#1A1A1A`) instead of the video. The title remains white. This maintains the cinematic feel even without the video
- **No error message.** The user doesn't need to know the video failed — the static dark background is a perfectly acceptable fallback that still looks intentional. The tap-to-continue behavior works identically
- **Alternative fallback consideration:** If a still frame from the video is available as a static image, it could be used as a secondary fallback before dropping to solid color. This is an implementation nicety, not a requirement

---

## 6. Data Dependencies

| Data Needed | Source | Tech Spec Reference |
|-------------|--------|---------------------|
| Video file (MP4) | Bundled app asset | N/A — static asset, no spec dependency |
| None (no data) | N/A | This screen reads no project data, no user data, no API data |

The Splash screen is entirely self-contained. It has no data dependencies whatsoever — no API calls, no file system reads, no project data. It's a static presentation layer that transitions to the next screen on user interaction.

---

## 7. Visual Language Application

### Typography usage on this surface

| Element | Font | Weight | Size | Color |
|---------|------|--------|------|-------|
| Product title (video playing) | Barlow | Thin (100) | 260pt | `#FFFFFF` |
| Product title (video loading) | Barlow | Thin (100) | 260pt | `#1A1A1A` |

**Font rule for this surface:** Only one font (Barlow) appears on this screen. Domine is not used — there is no body text, no labels, no metadata. This is a pure display surface.

**Size exception:** The 260pt title size exceeds the HARD_RULES maximum of 36pt. This is an intentional exception for the Splash screen's display treatment — the product name is functioning as a cinematic title card, not as a heading within a content layout. This exception applies only to this screen. The Discovery canvas already established precedent for exceptions (pill button radius, circular avatar).

### Corner radius usage

No rounded corners appear on this screen. There are no cards, panels, buttons, or bordered elements.

### Spacing

No spacing tokens apply. The screen has exactly two elements (video background + centered title) with no margins, padding, or gaps between content regions.

### Color usage

| Element | State | Color |
|---------|-------|-------|
| Screen background | Video loading | `#FFFFFF` (white) |
| Screen background | Video failed | `#1A1A1A` (dark) |
| Title text | Video loading | `#1A1A1A` (dark on white) |
| Title text | Video playing | `#FFFFFF` (white on video) |
| Title text | Video failed | `#FFFFFF` (white on dark) |

---

## 8. Responsive Behavior

The Splash screen must work across different viewport sizes (primarily desktop browsers, per HARD_RULES web-first constraint).

**Video scaling:** The video always covers the full viewport. On wide viewports, the video is cropped top and bottom. On tall viewports, the video is cropped left and right. The center of the video frame is always visible.

**Title scaling:** The 260pt size is designed for a 1920×1080 viewport. On significantly smaller viewports, the title may need to scale down to avoid overflow. A reasonable approach: use a CSS `clamp()` or viewport-relative unit so the title scales proportionally — e.g., `min(260pt, 14vw)` — ensuring it fills roughly the same proportion of the screen width regardless of viewport size. The exact implementation is flexible, but the title should never overflow the viewport or wrap to a second line.

**Minimum viable viewport:** The title "STORYENGINE" as a single line needs approximately 1100px of width at 260pt. Below that width, it must scale down. No viewport below 800px width needs to be supported (web-first, desktop-focused in v1).

---

## 9. Navigation Context

This screen is the first in a three-screen entry flow:

```
Splash Screen → Project Chooser → Step Menu → [Discovery or Workspace]
```

- **Entry:** The Splash screen is the app's root route (`/`). It renders when the user opens Story Engine.
- **Exit:** Tap/click anywhere (or any keypress) → navigate to the Project Chooser screen.
- **No back navigation:** There is no "back" from the Splash. If the user navigates back from the Project Chooser, they return here. But the Splash itself has no back target — it's the beginning.

**Route implication:** The current `Spec_Navigation.md` defines `/` as the Start Screen route. The Splash screen lives at this route. The Project Chooser and Step Menu will need route consideration — either as sub-routes, as in-memory state transitions on the same route, or as separate routes. That decision belongs to the specs for those screens, not this one.

---

## 10. Out of Scope

- **Project creation or selection UI.** The "Start New Story" and "Open Existing Project" options live on the Project Chooser screen, not here.
- **Step Menu / phase picker.** The numbered phase list (1 Discovery / 2 Development / 3 Refinement) is a separate screen.
- **Any data loading or API calls.** This screen is purely presentational.
- **User avatar or settings access.** No user-facing controls appear on this screen.
- **Video selection or customization.** The user cannot choose or change the background video in v1. It's a bundled asset.
- **Animated text or title effects.** The title is static text (aside from the loading-state color transition). No typing animation, no fade-in-per-letter, no parallax. Keep it simple.
- **Sound or music.** The video is muted. No background audio track in v1.
- **Skip animation or loading bypass.** If the user taps during the video-loading state, it should still navigate forward immediately — don't force them to wait for the video transition.

---

## 11. Open Questions

1. **Video content production:** Who produces the actual video clips? Are they AI-generated (e.g., via a video generation tool), licensed stock footage, or original footage? This affects asset pipeline but not the spec's behavior. The spec is agnostic to the video's origin.

2. **Video file size budget:** A 10–20 second looping video at 1080p could range from 2MB to 20MB depending on compression. Is there a bundle size budget for the app? A smaller, more compressed video loads faster but looks grainier. To be decided during implementation.

3. **Multiple video clips:** Should the Splash rotate between different video clips on each visit (showing a different atmospheric scene each time), or always play the same video? The current spec assumes a single video for simplicity. Rotation would be a nice-to-have but adds complexity.

---

## 12. Related Buildable Units

| Buildable Unit | Type | File Name |
|----------------|------|-----------|
| Splash Screen | Screen | `Screen_SplashScreen.md` |

This screen is simple enough that it likely doesn't need decomposition into sub-components. The video background and title are tightly coupled and don't appear anywhere else in the app. A single Screen-level Buildable Unit should suffice.

---

## Claude Code Handoff Prompt

```claude-code-handoff
Project: Story Engine | Repo: storyengine | Branch: main

Spec file: docs/start-screen/Spec_SplashScreen_Design.md
→ Read this spec (v0.1) for Splash screen layout, video background
  behavior, title treatment, loading states, and interaction rules.

Also read before starting:
- docs/HARD_RULES.md (non-negotiable constraints)
- docs/design/DESIGN.md (design system tokens — note: body font is
  now Domine, pending update)
- docs/foundation/Spec_Navigation.md (route context — Splash lives
  at the root route `/`)

Use this spec as the source of truth for layout, states, and
interaction rules when building the Splash screen.

Key constraints:
- Full-bleed video background, looping, muted, auto-playing (§3.1)
- "STORYENGINE" in Barlow Thin 260pt, centered — this intentionally
  exceeds the 36pt HARD_RULES max (§7)
- Tap/click anywhere or any keypress → navigate to next screen (§4.1)
- Loading state: title renders immediately on white, video fades in
  with 500ms transition, title color flips dark→white (§5.1)
- No buttons, no UI chrome, no controls — just video + title (§1)
- Video failure fallback: solid dark background #1A1A1A, no error
  message shown to user (§5.3)

Start with: the Splash screen shell at app/index.tsx — full-viewport
container, video element with autoplay/loop/muted, centered title
text, and tap-anywhere navigation handler. Get the basic layout
working with a placeholder video (solid dark background is fine for
initial testing), then add the loading-state transition.

Work incrementally. After getting the basic layout + navigation
working, stop and check in before adding the video transition
effects.
Commit after each step with a message like
"feat(splash): screen shell with title and tap-to-continue".
```

---

*This spec covers only the Splash screen — the first surface in the entry flow. The Project Chooser screen (Start New Story / Open Existing Project) and Step Menu (phase picker) are separate screens that will receive their own Design Specs. For navigation routing context, see `Spec_Navigation.md`.*
