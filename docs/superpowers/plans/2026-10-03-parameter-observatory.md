# Parameter Observatory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Independent audit agents provide regression tests and proposed isolated patches; the primary agent owns integration and the new laboratory.

**Goal:** A parameterized scientific laboratory with verified physical references, visual structure maps and meaningful links to the atlas.

**Architecture:** Pure numerical core and accessible laboratory interface are authored separately and embedded verbatim into the dependency-free standalone page. Legacy corrections change their actual authority, without new competing wrappers.

**Tech Stack:** JavaScript, Canvas 2D, existing WebGL2 scene, Node test runner, Playwright/Chromium.

**Spec:** `docs/superpowers/specs/2026-10-03-parameter-observatory-design.md`

## Global Constraints

- Release version 6.7.0; no runtime dependencies or external assets.
- Preserve Obsidian Atelier, native scene integration and XR authority.
- Every physical quantity has a unit, model scope and reproducible parameter set.
- Invalid inputs and unresolved results are explicit; no artificial precision or causal inference from shape alone.
- One numerical source per function; embedded source identity is verified.

## Review Focus

- Extreme temperatures, distances and parameter ranges must remain finite or explicitly invalid.
- A slow map superseded by a new study must never overwrite the new study or mutate native state.
- Spectral density per frequency and per wavelength must use the Jacobian; their peaks are distinct.
- Singular TE cutoff, zero loss, active/passive signs and complex-root conventions must agree with their equations.
- Keyboard, mobile and paper-theme interactions must remain readable and expose the same scientific controls.

### Task 1: Correct scientific authorities

**Files:** `index.html`, `tests/physical-authority.test.mjs`, `tests/discovery-authority.test.mjs`.
**Interfaces:** preserve existing model `response(x,p)` and discovery API; adjust values and scientifically unsupported labels at their source.

- [ ] Write and run independent failing physical and inference regression tests.
- [ ] Review numeric reproductions and apply localized model/method corrections.
- [ ] Run the new tests and existing Node suite; record original versus corrected evidence.
- [ ] Commit the corrected authorities.

### Task 2: Numerical laboratory core

**Files:** `_includes/uprs670-laboratory-core.js`, `tests/laboratory-core.test.mjs`.
**Interfaces:** `__UPRS670_CORE__`: constants; `planckNu(nu,T)`, `planckLambda(lambda,T)`, `blackbody(T)`, `blackbodyIntegral(T,n)`; `casimir(a,area,T)`; `canonical(kind,params)`, `resonance(u,Q)`; `logistic(options)`, `bifurcation(options)`, `cantorDust(depth)`, `boxDimension(points,divisions)`; `grid(options,evaluate)`; stable snapshot validation helpers.

- [ ] Write failing tests for spectral Jacobian, Wien peaks, integrated exitance, T⁴ and a⁻⁴ scaling, exact canonical bridges, logistic limits, Cantor dimension and input validation.
- [ ] Implement the pure functions with bounded sampling and explicit scope metadata.
- [ ] Verify independent analytic cases and parameter extremes; run the full Node suite.
- [ ] Commit the core and tests.

### Task 3: Linked visual laboratory

**Files:** `_includes/uprs670-laboratory-ui.html`, `tools/sync-laboratory.mjs`, `index.html`, `tests/browser-laboratory.cjs`.
**Interfaces:** core from Task 2; native model registry and `mapResponse`; native `setModel`, `recalc`, `setMode`; S³ API `__UPRS660__`. Expose `__UPRS670__` with open/close/study/snapshot/map/apply methods for integration and browser verification.

- [ ] Add a failing browser flow proving the laboratory entry, controls and actual computed plots exist.
- [ ] Implement the six studies, equation/source/assumption readouts, linked cursor, cancellable model maps, native synchronization and JSON export.
- [ ] Embed the exact sources and extend version ownership without repeated competing timers.
- [ ] Verify each study, cancellation, native-state preservation, narrow layouts, modal focus and paper theme; inspect screenshots.
- [ ] Commit the laboratory.

### Task 4: Release verification and publication

**Files:** `tools/verify-atlas.mjs`, `.github/workflows/v46-consolidation.yml`, `README.md`, `docs/v6.7.0-parameter-observatory.md`, `docs/v6.7.0-verification.json`.

- [ ] Add embedded-source and version checks; update artifact paths and module inventory.
- [ ] Run all Node and browser regression checks and built-in scientific tests; gather visual evidence and report hashes.
- [ ] Obtain a fresh whole-branch review, fix material findings and rerun the relevant checks.
- [ ] Publish the branch and PR; merge after passing CI under the user's standing publication instruction.
- [ ] Verify Pages deployment, exact source hash and live interaction; report the working link and substantive limits.
