import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDaysISO,
  classify,
  expandPattern,
  mondayOf,
  todayInTimeZone,
  visitCount,
  weekdayIndex,
} from '../shared/availability.js';

const COLE = {
  ranges: [{ weekdays: [1, 2, 3, 4, 5], start: '19:00', end: '21:00' }],
  slot: 15,
  buffer: 0,
  from: '2026-10-08',
  to: '2026-11-20',
};

const KAWIKA = {
  ranges: [
    { weekdays: [0], start: '13:00', end: '15:00' },
    { weekdays: [3], start: '19:00', end: '21:00' },
  ],
  slot: 30,
  buffer: 0,
  from: '2026-10-11',
  to: '2026-12-20',
};

test('Cole weeknights Oct 8 to Nov 20 create 32 windows in 7 weeks', () => {
  const rows = expandPattern(COLE);
  assert.equal(rows.length, 32);
  assert.equal(visitCount('19:00', '21:00', 15, 0), 8);
  const firstWeek = rows.filter((row) => mondayOf(row.window_date) === '2026-10-05');
  assert.deepEqual(firstWeek.map((row) => row.window_date), ['2026-10-08', '2026-10-09']);
  const weeks = new Set(rows.map((row) => mondayOf(row.window_date)));
  assert.equal(weeks.size, 7);
  assert.equal(rows.filter((row) => weekdayIndex(row.window_date) === 0 || weekdayIndex(row.window_date) === 6).length, 0);
});

test('re-running Cole against those rows is nothing new', () => {
  const rows = expandPattern(COLE);
  const plan = classify(rows, rows.map((row, index) => ({ ...row, id: `w${index}` })));
  assert.equal(plan.create.length, 0);
  assert.equal(plan.exact.length, 32);
  assert.equal(plan.overlap.length, 0);
});

test('Kawika Sundays and Wednesdays are 21, and unchecking Nov 25 leaves 20', () => {
  const rows = expandPattern(KAWIKA);
  assert.equal(rows.length, 21);
  assert.equal(rows.filter((row) => weekdayIndex(row.window_date) === 0).length, 11);
  assert.equal(rows.filter((row) => weekdayIndex(row.window_date) === 3).length, 10);
  const trimmed = expandPattern({ ...KAWIKA, excludedDates: ['2026-11-25'] });
  assert.equal(trimmed.length, 20);
  assert.equal(trimmed.some((row) => row.window_date === '2026-11-25'), false);
});

test('Sunday 6-8 touches nothing and Sunday 2-4 overlaps 1-3', () => {
  const existing = expandPattern({
    ranges: [{ weekdays: [0], start: '13:00', end: '15:00' }],
    slot: 30,
    from: '2026-10-11',
    to: '2026-12-20',
  }).map((row, index) => ({ ...row, id: `sun${index}` }));
  const evening = expandPattern({
    ranges: [{ weekdays: [0], start: '18:00', end: '20:00' }],
    slot: 30,
    from: '2026-10-11',
    to: '2026-12-20',
  });
  const eveningPlan = classify(evening, existing);
  assert.equal(evening.length, 11);
  assert.equal(eveningPlan.create.length, 11);
  assert.equal(eveningPlan.overlap.length, 0);

  const overlap = expandPattern({
    ranges: [{ weekdays: [0], start: '14:00', end: '16:00' }],
    slot: 30,
    from: '2026-10-11',
    to: '2026-12-20',
  });
  const overlapPlan = classify(overlap, existing);
  assert.equal(overlapPlan.overlap.length, 11);
  assert.equal(overlapPlan.create.length, 0);
});

test('touching windows are allowed and internal overlap is flagged', () => {
  const plan = classify(
    [{ window_date: '2026-10-08', start_time: '20:00', end_time: '21:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
    [{ id: 'a', window_date: '2026-10-08', start_time: '19:00', end_time: '20:00', slot_duration_minutes: 30, buffer_minutes: 0 }],
  );
  assert.equal(plan.create.length, 1);
  assert.equal(plan.overlap.length, 0);

  const internal = classify([
    { window_date: '2026-10-11', start_time: '13:00', end_time: '15:00', slot_duration_minutes: 30, buffer_minutes: 0 },
    { window_date: '2026-10-11', start_time: '14:00', end_time: '16:00', slot_duration_minutes: 30, buffer_minutes: 0 },
  ], []);
  assert.equal(internal.internalOverlap.length, 1);
});

test('DST fall-back does not shift Nov 1', () => {
  const rows = expandPattern({
    ranges: [{ weekdays: [0], start: '13:00', end: '15:00' }],
    slot: 30,
    from: '2026-11-01',
    to: '2026-11-01',
  });
  assert.deepEqual(rows.map((row) => row.window_date), ['2026-11-01']);
  assert.equal(addDaysISO('2026-11-01', 1), '2026-11-02');
});

test('Mountain today is a calendar date, not a UTC slice', () => {
  const justAfterMidnightUtc = new Date('2026-10-09T00:30:00Z');
  assert.equal(todayInTimeZone('America/Denver', justAfterMidnightUtc), '2026-10-08');
});
