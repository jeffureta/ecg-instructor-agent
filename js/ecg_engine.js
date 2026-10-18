/**
 * @file ecg_engine.js
 * @description Encapsulates clinical electrophysiology rules, normal interval benchmarks,
 * and 5-step ECG parsing logic. Adheres strictly to the Single Responsibility Principle.
 */

export const ECG_NORMAL_RANGES = Object.freeze({
  heartRate: { min: 60, max: 100, unit: 'bpm' },
  prInterval: { min: 120, max: 200, unit: 'ms' },
  qrsDuration: { min: 60, max: 119, unit: 'ms' },
  qtcMen: { max: 450, unit: 'ms' },
  qtcWomen: { max: 460, unit: 'ms' },
  qtcCriticalDanger: { min: 500, unit: 'ms' }
});

/**
 * Evaluates whether a measured heart rate represents bradycardia, normal rate, or tachycardia.
 * @param {number} rateInBpm - Heart rate in beats per minute.
 * @returns {'bradycardia' | 'normal' | 'tachycardia'} Clinical rate classification.
 */
export function classifyHeartRate(rateInBpm) {
  if (typeof rateInBpm !== 'number' || isNaN(rateInBpm) || rateInBpm <= 0) {
    throw new Error('Invalid heart rate provided. Must be a positive number.');
  }
  if (rateInBpm < ECG_NORMAL_RANGES.heartRate.min) {
    return 'bradycardia';
  }
  if (rateInBpm > ECG_NORMAL_RANGES.heartRate.max) {
    return 'tachycardia';
  }
  return 'normal';
}

/**
 * Determines whether a PR interval is normal, abnormally shortened, or prolonged.
 * @param {number} prIntervalMs - PR interval measured in milliseconds.
 * @returns {'shortened' | 'normal' | 'prolonged'} Conduction status.
 */
export function evaluatePrInterval(prIntervalMs) {
  if (typeof prIntervalMs !== 'number' || isNaN(prIntervalMs) || prIntervalMs <= 0) {
    throw new Error('Invalid PR interval provided. Must be a positive number.');
  }
  if (prIntervalMs < ECG_NORMAL_RANGES.prInterval.min) {
    return 'shortened';
  }
  if (prIntervalMs > ECG_NORMAL_RANGES.prInterval.max) {
    return 'prolonged';
  }
  return 'normal';
}

/**
 * Classifies QRS complex duration as normal or pathologically wide.
 * @param {number} qrsDurationMs - QRS duration in milliseconds.
 * @returns {'narrow' | 'wide'} QRS width classification.
 */
export function classifyQrsWidth(qrsDurationMs) {
  if (typeof qrsDurationMs !== 'number' || isNaN(qrsDurationMs) || qrsDurationMs <= 0) {
    throw new Error('Invalid QRS duration provided. Must be a positive number.');
  }
  return qrsDurationMs >= 120 ? 'wide' : 'narrow';
}

/**
 * Calculates corrected QT interval (QTc) using Bazett's formula: QTc = QT / sqrt(RR in seconds).
 * @param {number} qtIntervalMs - Measured QT interval in milliseconds.
 * @param {number} heartRateBpm - Ventricular rate in beats per minute.
 * @returns {number} Corrected QTc interval in milliseconds rounded to the nearest integer.
 */
export function calculateCorrectedQtc(qtIntervalMs, heartRateBpm) {
  if (qtIntervalMs <= 0 || heartRateBpm <= 0) {
    throw new Error('Both QT interval and heart rate must be positive values.');
  }
  const rrIntervalSeconds = 60 / heartRateBpm;
  const qtcMs = qtIntervalMs / Math.sqrt(rrIntervalSeconds);
  return Math.round(qtcMs);
}

/**
 * Checks whether a given QTc value poses high risk for Torsades de Pointes.
 * @param {number} qtcMs - Corrected QT interval in milliseconds.
 * @returns {boolean} True if QTc exceeds critical threshold of 500 ms.
 */
export function isQtcSeverelyProlonged(qtcMs) {
  return qtcMs >= ECG_NORMAL_RANGES.qtcCriticalDanger.min;
}

/**
 * Constructs a structured 5-step ECG clinical summary object from raw nurse observations.
 * @param {Object} rawInputs - Measurements collected from the nurse.
 * @returns {Object} Standardized 5-step diagnostic assessment payload.
 */
export function buildFiveStepAssessment(rawInputs) {
  const heartRate = Number(rawInputs.heartRate);
  const prIntervalMs = Number(rawInputs.prIntervalMs);
  const qrsDurationMs = Number(rawInputs.qrsDurationMs);
  const qtIntervalMs = Number(rawInputs.qtIntervalMs);

  const calculatedQtc = (qtIntervalMs > 0 && heartRate > 0)
    ? calculateCorrectedQtc(qtIntervalMs, heartRate)
    : null;

  return {
    step1_rate: {
      value: heartRate,
      classification: heartRate > 0 ? classifyHeartRate(heartRate) : 'unspecified'
    },
    step2_rhythm: {
      regularity: rawInputs.isRegular ? 'regular' : 'irregular',
      type: rawInputs.rhythmType || 'unspecified'
    },
    step3_pWaves: {
      present: Boolean(rawInputs.pWavesPresent),
      ratio: rawInputs.pToQrsRatio || '1:1'
    },
    step4_prInterval: {
      value: prIntervalMs,
      conduction: prIntervalMs > 0 ? evaluatePrInterval(prIntervalMs) : 'unspecified'
    },
    step5_shapeAndIntervals: {
      qrsWidth: qrsDurationMs > 0 ? classifyQrsWidth(qrsDurationMs) : 'unspecified',
      qrsDurationMs: qrsDurationMs,
      stDeviation: rawInputs.stDeviation || 'isoelectric',
      tWaveMorphology: rawInputs.tWaveMorphology || 'normal',
      qtcMs: calculatedQtc,
      isDangerousQtc: calculatedQtc ? isQtcSeverelyProlonged(calculatedQtc) : false
    }
  };
}
