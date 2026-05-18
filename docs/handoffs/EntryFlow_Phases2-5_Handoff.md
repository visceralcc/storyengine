# Story Engine — Entry Flow Build (Phases 2–5)

## Claude Code Handoff Prompt

```
Project: Story Engine
Repo: /Users/charliedenison-mini/dev/storyengine
Branch: main

═══════════════════════════════════════════════════
CONTEXT — READ THESE FILES FIRST (in this order):
═══════════════════════════════════════════════════

1. CLAUDE.md (root — project conventions, commit format, session rules)
2. docs/HARD_RULES.md (non-negotiable constraints — note the entry
   flow intentionally exceeds the 36pt type max)
3. docs/design/DESIGN.md (design system tokens — IMPORTANT: the body
   font is Noticia Text, NOT Noto Serif. DESIGN.md still says Noto
   Serif but that's a pending update. Use Noticia Text everywhere
   the spec says Noticia Text.)
4. docs/start-screen/Spec_SplashScreen_Design.md (Splash screen spec)
5. docs/start-screen/Spec_ProjectChooser_Design.md (Project Chooser spec)
6. docs/start-screen/Spec_StepMenu_Design.md (Step Menu spec)
7. docs/foundation/Spec_Navigation.md (route structure)
8. src/models/types.ts (Phase enum, project types)
9. src/models/factories.ts (createProject, initializeProject)

═══════════════════════════════════════════════════
CURRENT STATE
═══════════════════════════════════════════════════

Phase 1 is complete — Expo Router is installed, five routes exist
and navigation works between them. All screens are currently
placeholder text. The route files to update:

- app/index.tsx → Splash Screen (currently placeholder)
- app/choose.tsx → Project Chooser (currently placeholder)
- app/project/[projectId]/steps.tsx → Step Menu (currently placeholder)
- app/project/[projectId]/discovery.tsx → leave as placeholder
- app/_layout.tsx → root layout (already configured, headerShown: false)

Dependencies currently installed: expo, expo-router, react-native,
react-native-web, nanoid. NO font packages installed yet.

═══════════════════════════════════════════════════
PHASE 2 — SPLASH SCREEN (app/index.tsx)
═══════════════════════════════════════════════════

1. Install expo-font:
   npx expo install expo-font

2. Install Barlow font — use @expo-google-fonts/barlow:
   npx expo install @expo-google-fonts/barlow

3. Load Barlow_100Thin in the root layout (app/_layout.tsx) using
   useFonts from expo-font. Show nothing (return null) while fonts
   load. This keeps font loading centralized — all screens get it.

4. Replace the placeholder in app/index.tsx with the spec-accurate
   Splash screen:

   Layout:
   - Full-viewport Pressable container
   - "STORYENGINE" centered horizontally and vertically (slightly
     above true center — approximately 46% from top per spec §3.2)
   - Barlow Thin (weight 100), ALL CAPS, no letter-spacing adjustment
   - Title size: use a responsive approach — the spec says 260pt on
     a 1920×1080 viewport. Implement as: fontSize that scales with
     viewport width. On web, CSS clamp or a JS calculation works.
     The spec suggests min(260pt, 14vw). The title must NEVER wrap
     to a second line and must NEVER overflow the viewport.
     Minimum supported viewport width: 800px.

   States (spec §5):
   - LOADING STATE: White (#FFFFFF) background, title in dark
     (#1A1A1A). This is what renders immediately on load.
   - TRANSITION: After a brief delay (simulating video load), the
     background transitions to dark (#1A1A1A) and the title
     transitions to white (#FFFFFF). Both transitions happen
     simultaneously over 500ms. Use Animated API or CSS transitions.
   - DEFAULT STATE (post-transition): Dark (#1A1A1A) background,
     white (#FFFFFF) title.
   - We are NOT adding video yet — solid dark background stands in
     for the video. The transition from white→dark simulates the
     "video loaded" moment.

   Interaction:
   - Tap/click anywhere → router.push('/choose')
   - Any keypress → router.push('/choose') (add a keydown listener
     for desktop users — remember to clean up on unmount)
   - If user taps DURING the loading state (before transition
     completes), navigate immediately — don't force them to wait

5. No buttons, no text other than "STORYENGINE", no UI chrome.

STOP AND CHECK IN after Phase 2.

Commit: "feat(entry-flow): Phase 2 — Splash screen with title and transition"

═══════════════════════════════════════════════════
PHASE 3 — PROJECT CHOOSER (app/choose.tsx)
═══════════════════════════════════════════════════

1. Install Noticia Text font — use @expo-google-fonts/noticia-text:
   npx expo install @expo-google-fonts/noticia-text

2. Add NoticiaText_700Bold_Italic to the useFonts call in
   app/_layout.tsx (alongside the Barlow font from Phase 2).

3. Replace the placeholder in app/choose.tsx with the spec-accurate
   Project Chooser:

   Layout (spec §3):
   - White (#FFFFFF) background, full viewport
   - Content positioned in upper-left quadrant — NOT centered
   - Two rows, each containing:

     LEFT: Action label
       - Font: Barlow Thin (weight 100)
       - Size: 40pt
       - Color: #1A1A1A
       - Left-aligned, left edge at approximately x≈125

     RIGHT: Italic annotation
       - Font: Noticia Text Bold Italic (700 italic)
       - Size: 24pt
       - Color: #1A1A1A
       - Right-aligned against the right edge of the horizontal rule

     BELOW: Horizontal rule
       - 1px solid line
       - Width: approximately 922px (from x≈102 to x≈1024)
       - Color: #1A1A1A (dark)

   Row content (spec §3.3):
   Row 1: "Open existing Story" — annotation: "past"
   Row 2: "Start New Story" — annotation: "prologue"

   Vertical positioning (spec §3.4):
   - First row label: vertically centered at y≈418
   - First rule: y≈495
   - Second row label: vertically centered at y≈571
   - Second rule: y≈648
   - These are absolute positions for a 1080px viewport height.
     Use percentage-based or flexible positioning so it looks right
     at different viewport sizes while maintaining the "upper-left
     quadrant, generous whitespace below/right" composition.

4. Tap handlers (spec §4):
   - Each row's full region is the tap target (Pressable wrapping
     the entire row including label, annotation, and space above
     the rule), not just the text
   - "Start New Story": navigate to /project/[id]/steps — for now
     use a placeholder ID like 'placeholder'. We'll wire up real
     project creation in Phase 5.
   - "Open existing Story": console.log('Open existing — coming soon')
     (no destination screen exists yet)

5. No back button. No heading text. No explanatory copy. Just the
   two rows with their annotations and rules.

STOP AND CHECK IN after Phase 3.

Commit: "feat(entry-flow): Phase 3 — Project Chooser with two rows and annotations"

═══════════════════════════════════════════════════
PHASE 4 — STEP MENU (app/project/[projectId]/steps.tsx)
═══════════════════════════════════════════════════

1. Replace the placeholder in steps.tsx with the spec-accurate
   Step Menu:

   Layout (spec §3):
   - White (#FFFFFF) background, full viewport
   - Content in upper-left quadrant, same composition as Chooser
   - Three rows, each containing:

     LEFT: Phase number
       - Font: Barlow Thin (weight 100)
       - Size: 96pt
       - Left-aligned at x≈115

     RIGHT OF NUMBER: Phase name
       - Font: Barlow Thin (weight 100)
       - Size: 96pt
       - Left edge at x≈205 (gap of ~90px from number)
       - Same baseline as the number

     BELOW: Horizontal rule
       - 1px solid, 922px wide, x=102 to x=1024
       - Same style as Project Chooser rules

   Row content (spec §3.3):
   Row 1: "1" + "Discovery"     (rule at y≈425)
   Row 2: "2" + "Development"   (rule at y≈578)
   Row 3: "3" + "Refinement"    (rule at y≈731)

   Vertical rhythm: ~153px from one row center to the next.

2. Locked/unlocked visuals (spec §5.3):
   - UNLOCKED: Text color #1A1A1A, rule color dark (near-black)
   - LOCKED: Text color #999999, rule color #D2D2D2
   - No lock icons, no badges, no explanatory text
   - Hardcode for now: only Discovery is unlocked (new project state).
     Don't read from project data yet — just hardcode the lock states.

3. Tap handlers (spec §4):
   - Unlocked phase (Discovery): Pressable, navigates to
     /project/[projectId]/discovery
   - Locked phases: Use View instead of Pressable — tapping does
     nothing. No error message, no tooltip. The visual treatment
     communicates "not yet available."

4. No heading text, no project title, no metadata display.
   No "placeholder" or "projectId:" debug text.

STOP AND CHECK IN after Phase 4.

Commit: "feat(entry-flow): Phase 4 — Step Menu with three phases and lock states"

═══════════════════════════════════════════════════
PHASE 5 — POLISH
═══════════════════════════════════════════════════

1. Wire "Start New Story" to real project creation:
   - Import initializeProject from src/models/factories.ts
   - On tap "Start New Story" in choose.tsx:
     a. Call initializeProject({ name: 'Untitled Story' })
     b. Extract project.id from the returned bundle
     c. Navigate to /project/[project.id]/steps
   - The project data isn't persisted to disk yet (no persistence
     layer built) — that's fine. The ID just needs to be real and
     unique so the URL is correct.

2. Add subtle hover states on desktop for tappable rows:
   - Project Chooser rows: gentle opacity shift on hover (e.g.,
     opacity 0.7 on the label text). Keep it very restrained.
   - Step Menu unlocked row: same gentle opacity shift.
   - Locked rows: no hover effect (they're not interactive).
   - Use Pressable's style callback: ({ hovered }) => ... for web.
     Note: "hovered" is available on web via react-native-web's
     Pressable. If it doesn't work, use onHoverIn/onHoverOut state.

3. Test the full flow in browser (npx expo start --web):
   - Splash loads → white background, dark title
   - After ~500ms → background transitions to dark, title to white
   - Tap anywhere → navigates to Project Chooser
   - Tap "Start New Story" → generates real project ID → navigates
     to Step Menu at /project/proj_XXXXXXXX/steps
   - Step Menu shows three rows, only Discovery is clickable
   - Tap Discovery → navigates to /project/proj_XXXXXXXX/discovery
   - Discovery placeholder renders with the project ID

4. Run existing tests: npm test
   Make sure nothing broke from the placeholder changes.

5. Optional (if time): Add basic smoke tests for the three screens.
   Put them in app/__tests__/ or src/__tests__/. Simple render tests
   that confirm each screen renders without crashing.

Commit: "feat(entry-flow): Phase 5 — real project IDs, hover states, flow polish"

═══════════════════════════════════════════════════
KEY CONSTRAINTS (apply to all phases)
═══════════════════════════════════════════════════

- Web-first — test in browser (npx expo start --web)
- Entry flow typography intentionally exceeds the 36pt HARD_RULES
  max — this is specced and approved: 260pt (Splash), 96pt (Steps),
  40pt (Chooser)
- No buttons anywhere — just tappable text rows and full-screen
  tap targets
- Horizontal rules (922px, 1px) are a unifying visual element
  shared between Chooser and Step Menu
- Both Chooser and Step Menu use upper-left quadrant composition
  with generous whitespace below and to the right
- Barlow Thin (100 weight) is the only font weight used on ALL
  three screens for structural text
- Noticia Text Bold Italic (700 italic) is used ONLY for the
  annotations on the Chooser ("past", "prologue")
- DO NOT BUILD: video playback, Project List screen, workspace/
  discovery UI beyond existing placeholders, any settings or
  account features
- Commit after each phase with conventional commit messages
- Work phase by phase — stop and check in after each phase
```
