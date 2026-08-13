import {MECHANISMS_A} from './mechanisms-a';
import {MECHANISMS_B} from './mechanisms-b';
import {MECHANISMS_C} from './mechanisms-c';
import type {Mechanism} from './types';

export const MECHANISMS: Mechanism[] = [
  ...MECHANISMS_A,
  ...MECHANISMS_B,
  ...MECHANISMS_C,
];

export function getMechanism(id: string): Mechanism | undefined {
  return MECHANISMS.find((m) => m.id === id);
}
