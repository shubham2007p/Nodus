# VisualCanvas — Build Roadmap (V0 → Framework)
**"Describe meaning, not geometry." — a declarative Python DSL that turns `user >> api >> db` into a diagram.**

Rule for this whole doc: every version below must have **working, runnable code** before you move to the next. If a version's demo doesn't run, you don't advance — no exceptions, this is where the last handoff attempt failed.

---

## V0.1 — Prove the concept (Target: 3-4 hr session, this week)

**Goal**: `user >> api >> db` renders 3 boxes + 2 arrows in a browser. Nothing else.

```
visualcanvas/
  __init__.py
  core.py        # Node, Edge, Canvas classes
  render.py      # generates a static HTML file with inline SVG
demo.py
```

**Build**:
- `Node` — id, label
- `Edge` — source, target
- `Canvas` — holds `nodes[]`, `edges[]`; `.node(label)` creates+returns a Node
- Overload `>>` on `Node`: `a >> b` creates an Edge(a,b) on the shared canvas, returns `b` (so chaining `a >> b >> c` works)
- `Canvas.show()` — writes an HTML file with hardcoded SVG (boxes placed left-to-right, `x += 150` per node, `y` fixed), opens it in the browser via `webbrowser.open()`

**Demo**:
```python
from visualcanvas import Canvas
c = Canvas()
user, api, db = c.node("User"), c.node("API"), c.node("Database")
user >> api >> db
c.show()
```
**Stop condition**: if this doesn't render, don't touch V0.2.

---

## V0.2 — Serialization (Target: 1-2 hr)
- `Canvas.to_json()` — dumps nodes/edges as JSON
- Split responsibility: Python builds the scene graph → JSON → a separate `render.js` (vanilla JS) reads the JSON and draws SVG
- This is the point where Python stops touching the DOM at all — it only ever produces JSON

---

## V0.3 — Real browser renderer (Target: half day)
- Replace hardcoded SVG with a small local server (Python's built-in `http.server` is enough, no FastAPI yet) serving an `index.html` + `render.js`
- JS reads the JSON, draws nodes as `<rect>`+`<text>`, edges as `<line>` with arrowheads (SVG `marker`)
- **This is your first real milestone** — screenshot-able, demo-able

---

## V0.4 — Interaction (Target: 1-2 days)
- Drag nodes (mouse events in JS), pan/zoom on the canvas (simple transform on an SVG `<g>` wrapper)
- Dragging must NOT change the underlying Python scene graph — presentation state (position) lives only in the browser/JSON, separate from semantic state (edges). This separation is the actual engineering idea worth showing off — make sure it's visibly true in a demo (drag Database around, then re-run the Python with a changed edge, watch it update without moving your dragged position... or accept it resets, and be honest about that limitation).

---

## V0.5 — Styling (Target: 1-2 days)
- `node.style(color=..., shape=...)` — optional, chainable, doesn't break the plain syntax
- A default theme (see color theme section below) + ability to override per-node

---

## V0.6 — Frames/groups (Target: 1-2 days)
- `with canvas.frame("Auth"):` context manager grouping nodes visually (a bounding box)

---

## V0.7 — Layout engine (Target: 2-3 days, only if V0.1-0.6 actually shipped)
- Move off fixed `x += 150` to a real hierarchical/tree layout so branching graphs don't overlap
- This is genuinely hard — don't attempt before everything else works

---

## V0.8 — Animation (optional, only if you still want to keep going)
- Animate edges to show flow direction (dash-offset animation on SVG paths) — useful for teaching/pipeline demos

---

## V0.9 / V1 — Code-to-diagram, NL-to-diagram (way out — don't plan these in detail yet)
- AST-based Python→diagram, and an LLM-as-translator layer sitting above the DSL (LLM never touches rendering directly — it just outputs your DSL syntax)
- Revisit this section only after V0.3 is live and you've shown it to at least 3 people

---

## Realistic stopping point
Most portfolio value is captured by **V0.3–V0.5**. That's a real interactive-enough demo with styling. V0.6 onward is genuinely "framework" territory and is optional scope — don't feel obligated to go there just because it's listed. Ship V0.3, get it in front of people, decide from reactions whether V0.4+ is worth your time.

---

## Docs Website (parallel, starts once V0.3 exists — don't build docs for a framework with no working code)

**Purpose**: version history + "what changed" changelog + live examples, one page per version (V0.1 demo embedded, V0.2 demo embedded, etc.) — this doubles as your portfolio piece since it visually proves progression.

**Stack**: keep it as simple as the framework itself — a static site (plain HTML/CSS/JS or Next.js if you want React reps) is enough. No CMS, no backend needed; changelog can be a markdown file rendered at build time.

**Structure**:
```
docs/
  index.html          # hero: the "holy shit" demo — live editable code box -> live SVG output
  versions/
    v0.1.html          # each version's demo embedded + a short "what this version proves" note
    v0.2.html
    ...
  changelog.md
```

**"Techy" visual direction** (NVIDIA-adjacent — dark, high-contrast, glow accents):
- Background: near-black (`#0a0a0a` / `#0d0d0d`), not pure black
- Primary accent: NVIDIA green (`#76B900`) used sparingly — CTAs, active states, edge/connection lines in diagrams (this doubles nicely as your literal diagram-edge color)
- Secondary: white/light-gray text (`#e5e5e5`), muted gray for secondary text (`#8a8a8a`)
- Monospace font for code blocks (`JetBrains Mono` / `Fira Code`), a clean sans (`Inter` / `Space Grotesk`) for headings — this matches the monochrome/node-graph identity you already built for your LinkedIn banner, so it's consistent with your existing visual language, not a new direction
- Subtle glow/shadow on the accent color for a "circuit board" feel — `box-shadow: 0 0 20px rgba(118,185,0,0.3)` on hover states, used sparingly so it doesn't look like a template
- Motion (GSAP, once you're past core build): scroll-triggered reveal of each version's demo, not constant animation — restraint reads as more techy than motion-everywhere

**Sequencing**: don't start the docs site until V0.3 renders in a real browser. A docs site for code that doesn't run yet is the same trap as the 27-section handoff doc — polish before substance.

---

## Weekly discipline for this project
- One version tier per session block, checkpoint before moving on
- If a version takes 3x longer than estimated, that's data — tell me, we cut scope on the next version rather than pushing through
- This project doesn't replace your main sequential track (currently GenAI/Tutedude) — it's Track E (ship), gets leftover time, not primary time, until V0.3 exists and proves itself worth more investment
