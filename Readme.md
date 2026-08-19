# Nodus

> **"Describe meaning, not geometry."**
> 
> A Python DSL where `user >> api >> db` becomes a diagram — no drag, no click, no config file.

---

## What is Nodus?

Most diagramming tools ask you to *draw*.
Nodus asks you to *say*.

You describe relationships in plain Python. Nodus renders them into a live, interactive visual canvas in the browser — automatically, without you touching a single pixel.

This is not a charting library. It is not a wrapper around D3. It is a **declarative visual language** built on top of Python, where the code *is* the diagram.

---

## The Problem

Every tool that exists today puts the burden of layout on you.

You open Figma or Miro and spend 45 minutes moving boxes around.
You open Lucidchart and spend 20 minutes connecting arrows.
You write a Mermaid diagram and spend 10 minutes fighting its syntax.

None of them let you think about *what the system means*. They all force you to think about *where things are*.

Nodus inverts this. You write:

```python
canvas = ndu.canvas()
canvas.node("User") >> canvas.node("API") >> canvas.node("Database")
```

And Nodus figures out the rest.

---

## The Vision

Nodus is building toward a world where:

- **A developer can sketch a system architecture** as fast as they can type it
- **A student can visualize a concept** without leaving their editor
- **A team can share a diagram** that is also the source of truth — not a screenshot of one

The long-term north star: a Python statement becomes a live, shareable, annotatable, animated diagram. Not someday. Step by step, version by version.

---

## What It Looks Like Today

```python
import nodus as ndu

# A full-screen canvas
canvas = ndu.canvas()

# Divide into columns
canvas.columns(3)
left, middle, right = canvas[0], canvas[1], canvas[2]

# Build the diagram
middle.node("Internet", bg="yellow", id="internet_node")

right_block = right.block()
right_block.heading("How It Works")
right_block.text("Data flows from client to server...")
right_block.button("Learn More")

right_info = right.node_block(id="right_info")
right_info.node("How Internet Works")

# Connect them
ndu.connect("internet_node", "right_info", line="arrow")
```

This writes clean HTML + CSS to disk. Open it. That's your diagram.

---

## Roadmap

Nodus is built version by version. No version ships unless it runs.

| Version | What it proves | Status |
|---|---|---|
| **V0.1** | Python → boxes + arrows in a browser | ✅ In Progress |
| **V0.2** | Python scene graph → JSON → JS renderer | 🔲 |
| **V0.3** | Local dev server + real SVG renderer | 🔲 |
| **V0.4** | Drag nodes, pan/zoom — layout stays separate from semantics | 🔲 |
| **V0.5** | Per-node styling, themes | 🔲 |
| **V0.6** | Frame/group context manager | 🔲 |
| **V0.7** | Real layout engine (no more hardcoded positions) | 🔲 |
| **V0.8** | Animated edges — show data flow | 🔲 |
| **V0.9+** | AST → diagram, LLM → DSL → diagram | 🔲 |

> The most important milestone is **V0.3** — a real, screenshot-able, demo-able browser render. Everything before it is infrastructure. Everything after it is leverage.

---

## Design Philosophy

**1. Substance before polish.**
No docs until V0.3 runs. No framework claims until V0.1 ships. This project follows one rule: *working code before the next version, always.*

**2. Separation of concerns, visibly.**
Presentation state (where things are on screen) lives in the browser. Semantic state (what connects to what) lives in Python. These are not the same thing. Nodus makes that distinction real and enforces it.

**3. The DSL is the product.**
Not the renderer. Not the server. The moment someone writes `user >> api >> db` and sees it rendered — *that* is the thing worth building. Everything else serves that moment.

---

## Visual Direction

Nodus has a defined aesthetic — dark, high-contrast, technical.

- **Background**: near-black (`#0a0a0a`) — not pure black, never white
- **Primary accent**: NVIDIA-adjacent green (`#76B900`) — used sparingly for CTAs, active states, and edge lines
- **Text**: `#e5e5e5` primary, `#8a8a8a` secondary
- **Code**: `JetBrains Mono` / `Fira Code`
- **UI**: `Inter` / `Space Grotesk`
- **Glow**: `box-shadow: 0 0 20px rgba(118,185,0,0.3)` on hover — circuit board feel, used with restraint

This isn't decoration. The visual identity is part of the statement: Nodus is a tool built by someone who thinks about systems the same way they think about design.

---

## License

Nodus is **source-available**, not open-source.

You can read, fork for contribution, and use it for personal or educational purposes. You cannot redistribute, resell, or maintain an independent fork.

See [`support/License.md`](support/License.md) for the full terms.

---

## Status

This is active, early-stage development. The architecture is being proven. The DSL is being designed by running it.

If you want to follow the build: watch the repo.
If you want to contribute: open a PR to the official repository only.
If you want to use it commercially: reach out.

---

*Built by Shubham — 2026*
