import { describe, it, expect } from 'vitest';
import { springs } from './springs';

describe('Spring Physics Presets (C1)', () => {
  it('defines snappy spring with stiffness 400 and damping 30', () => {
    expect(springs.snappy.type).toBe('spring');
    expect(springs.snappy.stiffness).toBe(400);
    expect(springs.snappy.damping).toBe(30);
  });

  it('defines bouncy spring with stiffness 300 and damping 20', () => {
    expect(springs.bouncy.type).toBe('spring');
    expect(springs.bouncy.stiffness).toBe(300);
    expect(springs.bouncy.damping).toBe(20);
  });

  it('defines gentle spring with stiffness 200 and damping 24', () => {
    expect(springs.gentle.type).toBe('spring');
    expect(springs.gentle.stiffness).toBe(200);
    expect(springs.gentle.damping).toBe(24);
  });

  it('defines sheet spring with stiffness 320 and damping 32', () => {
    expect(springs.sheet.type).toBe('spring');
    expect(springs.sheet.stiffness).toBe(320);
    expect(springs.sheet.damping).toBe(32);
  });
});
