import { CardGrade, SRSState } from '../types';

export function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function createInitialSRSState(): SRSState {
  return {
    interval: 0,
    repetition: 0,
    easeFactor: 2.5,
    dueDate: getTodayString(),
    lastReviewed: null,
    status: 'new',
    lapses: 0,
    totalReviews: 0,
  };
}

/**
 * Calculates updated SRS state according to the SM-2 algorithm.
 */
export function calculateNextSRS(currentSRS: SRSState, grade: CardGrade): SRSState {
  const today = getTodayString();
  let interval = currentSRS.interval;
  let repetition = currentSRS.repetition;
  let easeFactor = currentSRS.easeFactor;
  let lapses = currentSRS.lapses;
  let status = currentSRS.status;

  if (grade === 'again') {
    // Failed recall: reset intervals
    interval = 0;
    repetition = 0;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
    lapses += 1;
    status = 'learning';
  } else if (grade === 'hard') {
    // Recalled with significant difficulty
    interval = Math.max(1, Math.round(interval * 1.2));
    repetition += 1;
    easeFactor = Math.max(1.3, easeFactor - 0.15);
    status = 'review';
  } else if (grade === 'good') {
    // Normal correct recall
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
    status = interval >= 21 ? 'mastered' : 'review';
  } else if (grade === 'easy') {
    // Instant, effortless recall
    if (repetition === 0) {
      interval = 4;
    } else if (repetition === 1) {
      interval = 7;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    repetition += 1;
    easeFactor = Math.min(3.0, easeFactor + 0.15);
    status = interval >= 21 ? 'mastered' : 'review';
  }

  // Calculate new due date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const nextDueDate = nextDate.toISOString().split('T')[0];

  return {
    interval,
    repetition,
    easeFactor: Number(easeFactor.toFixed(2)),
    dueDate: nextDueDate,
    lastReviewed: today,
    status,
    lapses,
    totalReviews: currentSRS.totalReviews + 1,
  };
}

/**
 * Returns human-readable interval estimates for the 4 Anki grade buttons.
 */
export function getEstimatedIntervals(currentSRS: SRSState): Record<CardGrade, string> {
  const { repetition, interval, easeFactor } = currentSRS;

  // Again
  const againText = '< 1 นาที';

  // Hard
  let hardInterval = Math.max(1, Math.round(interval * 1.2));
  if (repetition === 0) hardInterval = 1;
  const hardText = `${hardInterval} วัน`;

  // Good
  let goodInterval = 1;
  if (repetition === 0) goodInterval = 1;
  else if (repetition === 1) goodInterval = 3;
  else goodInterval = Math.max(1, Math.round(interval * easeFactor));
  const goodText = `${goodInterval} วัน`;

  // Easy
  let easyInterval = 4;
  if (repetition === 0) easyInterval = 4;
  else if (repetition === 1) easyInterval = 7;
  else easyInterval = Math.max(1, Math.round(interval * easeFactor * 1.3));
  const easyText = `${easyInterval} วัน`;

  return {
    again: againText,
    hard: hardText,
    good: goodText,
    easy: easyText,
  };
}

export function isCardDue(srs: SRSState): boolean {
  const today = getTodayString();
  return srs.dueDate <= today || srs.status === 'new';
}

export const isCardDueToday = isCardDue;

