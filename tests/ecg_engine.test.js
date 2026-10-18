/**
 * @file ecg_engine.test.js
 * @description Unit test suite validating clinical calculations, normal benchmarks,
 * and boundary conditions in ecg_engine.js.
 */

import {
  classifyHeartRate,
  evaluatePrInterval,
  classifyQrsWidth,
  calculateCorrectedQtc,
  isQtcSeverelyProlonged,
  buildFiveStepAssessment,
  ECG_NORMAL_RANGES
} from '../js/ecg_engine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function assertThrows(fn, message) {
  try {
    fn();
    failed++;
    console.error(`  ✗ FAIL (Expected throw): ${message}`);
  } catch (e) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  }
}

console.log('--- RUNNING ECG ENGINE CLINICAL TESTS ---');

// 1. Heart Rate Tests
console.log('\n[Suite 1: Heart Rate Classification]');
assert(classifyHeartRate(45) === 'bradycardia', '45 bpm is classified as bradycardia (< 60)');
assert(classifyHeartRate(59) === 'bradycardia', '59 bpm is classified as bradycardia');
assert(classifyHeartRate(60) === 'normal', '60 bpm is normal lower boundary');
assert(classifyHeartRate(80) === 'normal', '80 bpm is normal');
assert(classifyHeartRate(100) === 'normal', '100 bpm is normal upper boundary');
assert(classifyHeartRate(101) === 'tachycardia', '101 bpm is classified as tachycardia (> 100)');
assert(classifyHeartRate(150) === 'tachycardia', '150 bpm is classified as tachycardia');
assertThrows(() => classifyHeartRate(0), 'Throws on 0 bpm');
assertThrows(() => classifyHeartRate(-10), 'Throws on negative bpm');
assertThrows(() => classifyHeartRate(NaN), 'Throws on NaN');

// 2. PR Interval Tests
console.log('\n[Suite 2: PR Interval Conduction]');
assert(evaluatePrInterval(100) === 'shortened', '100 ms is shortened (< 120 ms)');
assert(evaluatePrInterval(120) === 'normal', '120 ms is normal lower boundary');
assert(evaluatePrInterval(160) === 'normal', '160 ms is normal conduction');
assert(evaluatePrInterval(200) === 'normal', '200 ms is normal upper boundary');
assert(evaluatePrInterval(210) === 'prolonged', '210 ms is prolonged (> 200 ms, 1st degree AV block)');
assert(evaluatePrInterval(320) === 'prolonged', '320 ms is prolonged AV conduction');
assertThrows(() => evaluatePrInterval(-5), 'Throws on negative PR');

// 3. QRS Duration Tests
console.log('\n[Suite 3: QRS Complex Width]');
assert(classifyQrsWidth(80) === 'narrow', '80 ms is narrow (< 120 ms)');
assert(classifyQrsWidth(119) === 'narrow', '119 ms is narrow');
assert(classifyQrsWidth(120) === 'wide', '120 ms is wide boundary (Bundle Branch Block / Ventricular)');
assert(classifyQrsWidth(160) === 'wide', '160 ms is wide complex');
assertThrows(() => classifyQrsWidth(0), 'Throws on 0 ms');

// 4. Bazett QTc & Prolongation Danger Tests
console.log('\n[Suite 4: Bazett QTc Calculation]');
// At 60 bpm, RR = 1 sec. sqrt(1) = 1. QTc = QT / 1 = QT.
assert(calculateCorrectedQtc(400, 60) === 400, 'At 60 bpm, QTc equals raw QT (400 ms)');
// At 100 bpm, RR = 0.60 sec. sqrt(0.60) ~= 0.774596. QT 360 / 0.774596 ~= 465 ms.
assert(calculateCorrectedQtc(360, 100) === 465, 'At 100 bpm and QT 360 ms, QTc rounds to 465 ms');
assert(!isQtcSeverelyProlonged(465), '465 ms is not critical danger (< 500 ms)');
assert(isQtcSeverelyProlonged(500), '500 ms triggers critical danger alert (Torsades risk)');
assert(isQtcSeverelyProlonged(540), '540 ms triggers critical danger alert');
assertThrows(() => calculateCorrectedQtc(-100, 75), 'Throws on invalid QT');
assertThrows(() => calculateCorrectedQtc(400, -75), 'Throws on invalid heart rate');

// 5. 5-Step Assessment Payload Builder
console.log('\n[Suite 5: 5-Step Assessment Payload]');
const testCase = {
  heartRate: 110,
  isRegular: false,
  rhythmType: 'irregularly-irregular',
  pWavesPresent: false,
  pToQrsRatio: 'none',
  prIntervalMs: 0,
  qrsDurationMs: 88,
  qtIntervalMs: 340,
  stDeviation: 'isoelectric',
  tWaveMorphology: 'normal'
};
const assessment = buildFiveStepAssessment(testCase);
assert(assessment.step1_rate.classification === 'tachycardia', 'Step 1 correctly identified as tachycardia');
assert(assessment.step2_rhythm.regularity === 'irregular', 'Step 2 identified as irregular');
assert(assessment.step3_pWaves.present === false, 'Step 3 identified no P-waves');
assert(assessment.step5_shapeAndIntervals.qrsWidth === 'narrow', 'Step 5 QRS width is narrow');
assert(typeof assessment.step5_shapeAndIntervals.qtcMs === 'number', 'Step 5 QTc is calculated');

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
