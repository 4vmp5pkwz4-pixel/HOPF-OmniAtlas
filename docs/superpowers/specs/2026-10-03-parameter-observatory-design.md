# Parameter Observatory · v6.7.0

The user wants a precise, richly visual, parameterized instrument for finding structures and connections across physical phenomena. They have delegated design judgment and authorized completing and publishing the atlas. The existing Obsidian Atelier visual language and standalone operation are constraints. This release strengthens scientific authority before expanding the catalogue; it cannot claim to simulate every phenomenon in the universe.

## Selected architecture

Retain the existing scene and XR authority. Add one cohesive laboratory, opened from the atlas, with a shared pattern: equation → physical parameters → plot → quantitative result → assumptions/source → reproducible snapshot. Author the new pure numerical core and interface in separate `_includes` files, embedded verbatim in `index.html` by a narrow synchronization tool. The release verifier checks identity so the standalone artifact cannot silently diverge from its source.

Alternatives considered: extending every legacy floating panel would retain fragmentation; replacing the full application would risk its established scientific and XR capabilities. A shared laboratory plus targeted corrections supplies a complete useful workflow while preserving those capabilities.

## Scientific authority

1. Correct demonstrated sign, branch, propagation and singular-limit bugs in the physical catalogue using independent analytic tests.
2. Correct the double normalization of stochastic barriers; restrict causal tools to appropriate axes and qualify dependence claims. Report persistent homology at the sampled scale without equating missing H1 with contractibility or disconnected samples with multistability.
3. Add Planck radiance in frequency and wavelength representations, using exact SI h, c, kB. Show the distinct peak positions and independently integrate the spectrum against Stefan–Boltzmann. Reject nonphysical inputs; protect exponential extremes.
4. Add ideal parallel-plate, zero-temperature Casimir pressure, energy/area and force. Temperature controls an explicit thermal applicability diagnostic and Planck radiation-pressure comparison, not an invented finite-temperature correction. Material dispersion, roughness, edge effects and Lifshitz integration remain outside this model.
5. Expose the exact common nondimensional form of electrical RLC, mechanical mass–spring and acoustic Helmholtz impedances: Z/R = 1 + iQ(u − 1/u), u = ω/ω0. Comparisons report a numerical residual against each actual model, not a similarity confidence score.
6. Show logistic-map bifurcation and finite-time Lyapunov estimates with editable r, initial state, transient and sample count. Include a true self-similar Cantor-dust reference with finite-scale box counting and its analytic dimension. Do not label a finite-sample estimate as proof of fractality or universal chaos.

## Shared model map

The laboratory can evaluate a selected native model over its independent axis and one physical parameter. It uses the actual `response` and `mapResponse`, records frozen parameters, units, bounds and scale, and masks invalid cells. Evaluation is chunked and cancellable; stale jobs never replace a newer result. The map displays response magnitude or phase, with a legend and a selected physical coordinate. Applying a selection updates the native model, range, parameter and selected sample; showing it on S³ uses the existing physical scene and disables reference-only focus. Sampling does not mutate the active model or parameter object.

## Presentation and interaction

One accessible modal workspace with six studies: Planck, Casimir, resonances, fractals, native model map, and S³ connections. Restrained obsidian, champagne, opal and violet; generous plotting area, fine scales, serif study titles and legible numeric labels. All artwork in scientific plots comes from computed data. The original interactive sculpture remains the atlas entry view. Narrow screens use a single-column flow with controls and plots fully reachable; paper theme remains readable. Escape closes, focus returns to the opener, keyboard users can select plot positions and operate every control.

The study controls include numeric values and suitable logarithmic/linear sliders. Every study exports a JSON experiment containing schema/version, model equations and source IDs, parameters with units, sampling choices, results, limits and selected coordinates. Exporting never asserts experimental validation.

## Acceptance

- Existing topology, renderer, XR and initialization tests remain green.
- New numerical tests use analytic limits, scaling laws, independent quadrature, unit/phase consistency and malformed inputs.
- Browser verification exercises every study, real parameter edits, map cancellation, native synchronization, JSON export/import where supported, keyboard/modal behavior, mobile and paper layouts, and absence of page errors.
- Verify original 3D interaction and built-in self-tests on the final application, then verify the deployed source hash and the live laboratory on Pages.

## Scope boundaries

No invented universal equivalence, physical causation from visual resemblance, experimental confidence percentages, full Maxwell/QED solver or material-specific Casimir claim. The numerical and visual evidence is inspectable and each model states what it computes.
