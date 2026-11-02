export type SpringPreset = {
  type: 'spring';
  stiffness: number;
  damping: number;
  mass?: number;
};

export const springs = {
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
    mass: 0.8,
  } as const satisfies SpringPreset,

  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 20,
    mass: 1,
  } as const satisfies SpringPreset,

  gentle: {
    type: 'spring',
    stiffness: 200,
    damping: 24,
    mass: 1,
  } as const satisfies SpringPreset,

  sheet: {
    type: 'spring',
    stiffness: 320,
    damping: 32,
    mass: 0.85,
  } as const satisfies SpringPreset,
};
