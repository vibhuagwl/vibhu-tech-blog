import type {PatternCard} from './types';

/** Identity helper so catalog modules stay typed without sprawling casts. */
export function gofCard(card: PatternCard): PatternCard {
  return card;
}
