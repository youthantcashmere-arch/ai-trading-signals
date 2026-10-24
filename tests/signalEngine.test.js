import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRsi, buildSignalFromSeries, classifyDataStatus } from '../src/signalEngine.js';

test('calculateRsi returns a finite numeric value for a valid price series', () => {
  const prices = Array.from({ length: 40 }, (_, index) => 100 + index * 0.5);
  const result = calculateRsi(prices, 14);
  assert.ok(Number.isFinite(result));
  assert.ok(result >= 0 && result <= 100);
});

test('buildSignalFromSeries returns HOLD for flat price history', () => {
  const series = Array.from({ length: 30 }, () => ({ price: 100 }));
  const result = buildSignalFromSeries(series);
  assert.equal(result.signal, 'HOLD');
  assert.ok(result.explanation.includes('HOLD'));
});

test('classifyDataStatus marks recent data as live and stale data as stale', () => {
  assert.equal(classifyDataStatus(2), 'live');
  assert.equal(classifyDataStatus(15), 'delayed');
  assert.equal(classifyDataStatus(61), 'stale');
});
