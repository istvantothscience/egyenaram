import assert from 'node:assert/strict';
import { solveCircuit, evaluateCircuitStatus } from './solver';
import type { CircuitComponent, Wire } from './types';

function makeBattery(id = 'bat1'): CircuitComponent {
  return {
    id,
    type: 'battery',
    x: 200,
    y: 200,
    rotation: 0,
    props: { voltage: 4.5, internalResistance: 1 },
  };
}

function makeBulb(id: string): CircuitComponent {
  return {
    id,
    type: 'bulb',
    x: 400,
    y: 200,
    rotation: 0,
    props: { resistance: 15 },
  };
}

function makeSwitch(id: string, closed: boolean): CircuitComponent {
  return {
    id,
    type: 'switch',
    x: 300,
    y: 300,
    rotation: 0,
    props: { closed, resistance: 0.01 },
  };
}

function makeWire(
  id: string,
  fromId: string,
  fromT: 0 | 1,
  toId: string,
  toT: 0 | 1
): Wire {
  return {
    id,
    from: { componentId: fromId, terminalIndex: fromT },
    to: { componentId: toId, terminalIndex: toT },
    elbowDir: 'hv',
  };
}

// 1. Elem + izzó zárt körben ≈ 0,28 A
{
  const bat = makeBattery();
  const bulb = makeBulb('b1');
  const wires = [
    makeWire('w1', 'bat1', 1, 'b1', 0),
    makeWire('w2', 'b1', 1, 'bat1', 0),
  ];
  const sol = solveCircuit([bat, bulb], wires);
  const iBat = sol.componentCurrents.bat1;
  const iBulb = sol.componentCurrents.b1;
  assert.ok(Math.abs(iBat - 0.2809) < 0.002, `Expected ~0.281 A, got ${iBat}`);
  assert.ok(Math.abs(iBulb - 0.2809) < 0.002, `Expected bulb ~0.281 A, got ${iBulb}`);
  assert.equal(sol.isShortCircuit, false);
  assert.deepEqual(sol.litBulbIds, ['b1']);
  console.log('✓ 1. Elem + izzó zárt körben:', iBat.toFixed(4), 'A');
}

// 2. Az elem két pólusa vezetékkel összekötve ≈ 4,46 A (rövidzárlat)
{
  const bat = makeBattery();
  const wires = [makeWire('w1', 'bat1', 1, 'bat1', 0)];
  const sol = solveCircuit([bat], wires);
  const iBat = sol.componentCurrents.bat1;
  assert.ok(Math.abs(iBat - 4.4554) < 0.01, `Expected ~4.455 A, got ${iBat}`);
  assert.equal(sol.isShortCircuit, true);
  console.log('✓ 2. Rövidzárlat az elemen:', iBat.toFixed(4), 'A');
}

// 3. Két izzó sorosan ≈ 0,145 A
{
  const bat = makeBattery();
  const b1 = makeBulb('b1');
  const b2 = makeBulb('b2');
  const wires = [
    makeWire('w1', 'bat1', 1, 'b1', 0),
    makeWire('w2', 'b1', 1, 'b2', 0),
    makeWire('w3', 'b2', 1, 'bat1', 0),
  ];
  const sol = solveCircuit([bat, b1, b2], wires);
  const iBat = sol.componentCurrents.bat1;
  assert.ok(Math.abs(iBat - 0.145) < 0.002, `Expected ~0.145 A, got ${iBat}`);
  assert.equal(sol.litBulbIds.length, 2);
  console.log('✓ 3. Két izzó sorosan:', iBat.toFixed(4), 'A');
}

// 4. Két izzó párhuzamosan az elemen ≈ 0,53 A összesen
{
  const bat = makeBattery();
  const b1 = makeBulb('b1');
  const b2 = makeBulb('b2');
  const wires = [
    makeWire('w1', 'bat1', 1, 'b1', 0),
    makeWire('w2', 'bat1', 1, 'b2', 0),
    makeWire('w3', 'b1', 1, 'bat1', 0),
    makeWire('w4', 'b2', 1, 'bat1', 0),
  ];
  const sol = solveCircuit([bat, b1, b2], wires);
  const iBat = sol.componentCurrents.bat1;
  assert.ok(Math.abs(iBat - 0.5288) < 0.005, `Expected ~0.529 A, got ${iBat}`);
  assert.equal(sol.litBulbIds.length, 2);
  console.log('✓ 4. Két izzó párhuzamosan:', iBat.toFixed(4), 'A');
}

// 5. Nyitott kapcsoló és üres munkalap
{
  const emptySol = solveCircuit([], []);
  assert.equal(emptySol.isShortCircuit, false);
  assert.equal(evaluateCircuitStatus([], [], emptySol).kind, 'no_battery');

  const bat = makeBattery();
  const sw = makeSwitch('sw1', false);
  const b1 = makeBulb('b1');
  const wires = [
    makeWire('w1', 'bat1', 1, 'sw1', 0),
    makeWire('w2', 'sw1', 1, 'b1', 0),
    makeWire('w3', 'b1', 1, 'bat1', 0),
  ];
  const sol = solveCircuit([bat, sw, b1], wires);
  assert.ok(Math.abs(sol.componentCurrents.b1) < 1e-4);
  assert.equal(evaluateCircuitStatus([bat, sw, b1], wires, sol).kind, 'switch_open');
  console.log('✓ 5. Nyitott kapcsoló és üres munkalap rendben');
}
