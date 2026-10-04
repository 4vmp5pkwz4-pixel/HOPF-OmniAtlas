import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
function laboratory(axis = 'Time', axisUnit = 's') {
  const context = {
    state: {model: 'fixture', mode: 'hopf', sweep: []},
    UPRSO_MODELS: {fixture: {axis, axisUnit}},
  };
  vm.createContext(context);
  for (const id of ['uprs550PhaseSpaceEngine', 'uprs560PhaseGeometryS3',
    'uprs620TopologicalAtlas', 'uprs650PredictiveMethods']) {
    const block = html.match(new RegExp(`<script id="${id}">([\\s\\S]*?)<\\/script>`));
    assert.ok(block, `production module ${id} exists`);
    vm.runInContext(block[1], context);
  }
  return context;
}
function random(seed) {
  return () => {seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296;};
}
function autoregression(seed, n = 400) {
  const rng = random(seed), values = [];
  let value = 0;
  for (let i = 0; i < n + 1000; i++) {
    value = .99 * value + rng() - .5;
    if (i >= 1000) values.push(value);
  }
  return values;
}
function sweep(context, x, y = x.map(() => 0), dt = 1) {
  context.state.sweep = x.map((value, i) => ({x: i * dt, gamma: {re: value, im: y[i]}}));
}
const near = (a, b, tol = 1e-10) => assert.ok(Math.abs(a - b) < tol, `${a} != ${b}`);

test('repeated states in a finite periodic measure cannot produce a fractional dimension', () => {
  const core = laboratory().__UPRS550__.core;
  const points = Array.from({length: 400}, (_, i) => [[0, .2, .7, 1][i % 4]]);
  const result = core.correlationDim(points);
  assert.equal(result.D2, null);
  assert.equal(result.status, 'unresolved');
  assert.equal(result.reason, 'atomic-distances-dominate');
  assert.ok(result.zeroPairs > 0);
  assert.equal(result.pairs, result.samples * (result.samples - 1) / 2);
});

test('correlation-dimension sampling honors its explicit point budget', () => {
  const core = laboratory().__UPRS550__.core, rng = random(17);
  const points = Array.from({length: 700}, () => [rng(), rng()]);
  assert.ok(core.correlationDim(points, {cap: 360}).samples <= 360);
});

test('an open semicircle has no closed-orbit winding or enclosed area', () => {
  const core = laboratory().__UPRS550__.core;
  const points = Array.from({length: 100}, (_, i) => [Math.cos(Math.PI * i / 99), Math.sin(Math.PI * i / 99)]);
  const result = core.portrait(points);
  assert.equal(result.closedOrbit, false);
  assert.equal(result.winding, null);
  assert.equal(result.enclosedArea, null);
  assert.ok(result.closingGap > result.closureTolerance);
});

test('a densely sampled full circle retains its winding and enclosed area', () => {
  const core = laboratory().__UPRS550__.core;
  const points = Array.from({length: 720}, (_, i) => [Math.cos(2 * Math.PI * i / 720), Math.sin(2 * Math.PI * i / 720)]);
  const result = core.portrait(points);
  assert.equal(result.closedOrbit, true);
  near(result.winding, 1, 1e-10);
  near(result.enclosedArea, Math.PI, 2e-4);
});

// Reintroducing the extra division by D2 would make this live-analysis check fail.
test('the reported escape exponent uses the already dimensionless potential barrier once', () => {
  const c = laboratory(), rng = random(999), values = [], dt = .02;
  let x = 1;
  for (let i = 0; i < 1200; i++) {
    const normal = Math.sqrt(-2 * Math.log(Math.max(1e-12, rng()))) * Math.cos(2 * Math.PI * rng());
    x += (x - x * x * x) * dt + .7 * Math.sqrt(dt) * normal;
    values.push(x);
  }
  sweep(c, values, undefined, dt);
  const result = c.__UPRS650__.analyze().drift;
  assert.equal(result.status, 'applied');
  assert.ok(result.transition?.deltaU > 0, 'the synthetic process visits two estimated wells');
  near(result.barrierOverNoise, result.transition.deltaU);
  assert.equal(result.potentialConvention, 'dimensionless-minus-integral-D1-over-D2');
});

test('a double-well potential has barrier 1/(4D), and doubling D halves that barrier', () => {
  const core = laboratory().__UPRS650__.core;
  const barriers = [.1, .2].map(D => {
    const cells = Array.from({length: 401}, (_, i) => {
      const x = -2 + i * .01;
      return {x, D1: x - x ** 3, D2: D, count: 100};
    });
    const potential = core.potential({cells}), extrema = core.wellsAndBarriers(potential);
    const well = extrema.wells.find(p => p.x < 0), barrier = extrema.barriers.find(p => Math.abs(p.x) < .01);
    near(barrier.U - well.U, .25 / D, 3e-4);
    return barrier.U - well.U;
  });
  near(barriers[0], 2 * barriers[1]);
});

test('cross mapping declines on a frequency sweep even if coordinate reconstruction improves', () => {
  const c = laboratory('Frequency', 'Hz');
  sweep(c, autoregression(1), autoregression(92));
  assert.equal(c.__UPRS650__.analyze().causality.status, 'not-applicable');
});

test('discrete-time cross mapping remains applicable and reports coordinate dependence', () => {
  const c = laboratory('Iteration', 'step');
  sweep(c, autoregression(3), autoregression(94));
  const result = c.__UPRS650__.analyze().causality;
  assert.equal(result.status, 'applied');
  assert.equal(result.causal, false);
  assert.equal(result.evidence, 'exploratory-reconstruction-dependence');
  assert.ok(result.xFromY?.curve && result.yFromX?.curve);
  assert.ok(!/→|caus/i.test(result.verdict));
});

test('cross mapping and finite-increment diffusion decline on nonuniform time samples', () => {
  const c = laboratory();
  sweep(c, autoregression(1), autoregression(92));
  c.state.sweep[100].x += .25;
  const result = c.__UPRS650__.analyze();
  assert.equal(result.causality.status, 'not-applicable');
  assert.equal(result.drift.status, 'not-applicable');
  assert.equal(result.causality.reason, 'nonuniform-sampling');
});

test('an explicit Theiler window excludes neighboring time indices from cross mapping', () => {
  const core = laboratory().__UPRS650__.core, values = autoregression(1, 100);
  const estimate = core.crossMap(values, values, 3, 1, 100, 7, {theiler: 100});
  assert.ok(Number.isNaN(estimate), 'excluding every possible neighbor leaves no estimate');
});

test('the default temporal exclusion preserves the known coupled-map reconstruction asymmetry', () => {
  const core = laboratory().__UPRS650__.core, X = [], Y = [];
  let x = .4, y = .2;
  for (let i = 0; i < 1000; i++) {
    const nx = x * (3.8 - 3.8 * x - .02 * y), ny = y * (3.5 - 3.5 * y - .10 * x);
    x = Math.min(1, Math.max(0, nx)); y = Math.min(1, Math.max(0, ny));
    if (i >= 300) {X.push(x); Y.push(y);}
  }
  const result = core.ccm(X, Y, {E: 3, tau: 1, libSizes: [20, 40, 80, 160, 320, 500]});
  assert.ok(result.theiler >= 2);
  assert.ok(result.xFromY.converged);
  assert.ok(result.xFromY.last > .9 && result.xFromY.last > result.yFromX.last);
});

test('changing only the imaginary observable invalidates cached cross mapping', () => {
  const c = laboratory();
  sweep(c, autoregression(1), autoregression(92));
  const first = c.__UPRS650__.analyze();
  c.state.sweep.forEach(p => {p.gamma.im = 0;});
  const next = c.__UPRS650__.analyze();
  assert.notEqual(next, first);
  assert.equal(next.causality.verdict, 'no-convergence');
});

test('the persistence metric includes every embedding coordinate', () => {
  const core = laboratory().__UPRS620__.core;
  const points = [[0, 0, 0, 0], [0, 0, 0, 4]];
  near(core.distMatrix(points)[1], 4);
  near(core.diameter(points), 4);
});

test('zero H1 on a sphere is reported without a contractibility claim', () => {
  const core = laboratory().__UPRS620__.core;
  const points = Array.from({length: 60}, (_, i) => {
    const y = 1 - 2 * i / 59, r = Math.sqrt(1 - y * y), a = Math.PI * (3 - Math.sqrt(5)) * i;
    return [r * Math.cos(a), y, r * Math.sin(a)];
  });
  const homology = core.persistence(points), classification = core.classify(homology, 2);
  assert.equal(homology.essentialH1, 0);
  assert.equal(classification.structure, 'no-h1-at-cutoff');
  assert.equal(classification.dynamicalInterpretation, 'undetermined');
});

test('the two states of one period-two orbit do not establish multistability', () => {
  const core = laboratory().__UPRS620__.core;
  const points = Array.from({length: 60}, (_, i) => [[0, 0, 0], [1, 0, 0]][i % 2]);
  const homology = core.persistence(points), classification = core.classify(homology, 1);
  assert.equal(homology.components, 2);
  assert.equal(classification.structure, 'disconnected');
  assert.equal(classification.dynamicalInterpretation, 'undetermined');
});

test('an incomplete Rips complex cannot certify topology', () => {
  const core = laboratory().__UPRS620__.core;
  const points = Array.from({length: 24}, (_, i) => [Math.cos(i), Math.sin(i), 0]);
  const homology = core.persistence(points, {maxR: 3, capT: 3});
  assert.equal(homology.truncated, true);
  assert.equal(core.classify(homology, 2).structure, 'incomplete');
});

test('topology uses original delay vectors and preserves their display-point correspondence', () => {
  const c = laboratory();
  const values = Array.from({length: 300}, (_, i) => .6 + .1 * Math.sin(i * .12) + .03 * Math.sin(i * .071));
  sweep(c, values);
  const geometry = c.__UPRS560__.geometry(), result = c.__UPRS620__.analyze();
  assert.equal(result.metricSpace, 'delay-embedding');
  assert.ok(geometry.stateVectors[0].length >= 4);
  assert.equal(result.metricPoints.length, result.displayPoints.length);
  result.sampleIndices.forEach((index, j) => {
    assert.deepEqual(Array.from(result.metricPoints[j]), Array.from(geometry.stateVectors[index]));
    assert.deepEqual(Array.from(result.displayPoints[j]), Array.from(geometry.attractor[index]));
  });
});
