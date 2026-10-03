# S³ phase-fibre topology update

The user requested completion of the atlas update after inspecting open branches,
with accurate, visual features grounded in current research. The existing
Hopfion mode is the implementation boundary; the atlas remains an offline,
dependency-free `index.html`.

## Geometry and evidence

Show complete constant-phase fibres on the Clifford torus in S³, for the phase
map Φ = q α − p β (mod 2π). A fibre has d = gcd(|p|,|q|) components. Each
component winds (p/d,q/d); two distinct complete fibres have total signed
linking pq, with pq/d² per component pair under the stated orientation.
Render Φ=0 and Φ=π in contrasting colours using exact stereographic projection.
Supply presets, p/q controls, a phase cursor and an optional torus wireframe.
Keep reference topology clearly separate from the selected physical response.

Independently measure linking from closed polygonal curves with signed solid
angles, report the numerical residual and sampling resolution, and refuse
open, coincident, intersecting or unresolved curves. No rounded integer is a
substitute for a computation. Cap winding at 8 and verify polygons at two
resolutions. Reject zero/noninteger winding and coincident phase fibres.

Source: arXiv:2608.15499, equations (7)–(11), accessed 2026-10-03. Related context:
arXiv:2608.24116 and arXiv:2607.26839. Mark these as preprints. This geometric
reference does not solve the acoustic wave equation or micromagnetics and does
not reproduce an experimental field. The pq value is the ideal phase-fibre
linking prediction, not a Hopf invariant measured from an imported field.

## Existing branch completion

PR #8 identifies an artificial requestSession timeout. Remove that deadline
from current XR authority, retain a nonfatal permission reminder and token
cleanup, and synchronise the compressed module used by the legacy builder.
Check that generated artifacts cannot substitute an older release for current
index.html. Preserve all later scientific modules in the published artifact.

## Verification

Analytic fixtures: fundamental Hopf link, unlinked circles, reversed orientation,
T(2,2) and T(2,3), component phase equation, norm and projection round trips.
Behaviour fixtures: permission granted after 20 seconds, user rejection and
stale request cleanup. Browser: full self-tests, unique scene IDs, mode changes,
cursor selection/drag, presets, narrow viewports and persistent release version.
