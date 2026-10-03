# S³ Obsidian Atelier visual restoration

The user rejects the schematic new topology layer and asks for artistic
refinement consistent with the original premium Obsidian Atelier. The goal
is an interactive scientific sculpture: volume, material, light and spatial
legibility, with discreet typography and controls. Use the existing main
design system as the reference unless the user supplies a different version.

Implement a dependency-free WebGL2 presentation module inside index.html.
Build closed tubes around the exact v6.6 phase-fibre centre lines using
rotation-minimising frames with seam correction. Radius is conservatively
bounded by winding separation. Match the existing camera projection exactly
so picking, phase dragging, yaw/pitch/roll and zoom retain their coordinates.

Use GGX lighting, soft procedural reflections, champagne and opal materials,
depth-tested occlusion, multisampling, an optional HDR render target and
restrained bloom with filmic tone mapping. Reuse the existing render loop;
cache geometry and buffers, cap pixel budgets, honour reduced motion and
retain Canvas fallback when WebGL2 is unavailable or a context is lost.
Decorative materials and a faint phase-fibre veil are presentation choices;
they do not change linking calculations or represent a measured field.

Keep the original scientific layers and non-S³ modes intact. Typography,
controls and labels inherit Obsidian Atelier; a compact caption and legend
explain closed fibres and linking. The inspector stays collapsed initially.
Provide a clear way to switch between volume rendering and lines, with
responsive placement and the original light/paper themes supported.

Verify frame normals, closed seams, projection correspondence, invalid
inputs, actual WebGL rendering/readback, context loss/recovery, winding
changes, layer gates and real pointer dragging. Inspect screenshots at
desktop/mobile sizes, and measure render cost without claiming a device
benchmark for untested hardware. Preserve all prior mathematical tests.
