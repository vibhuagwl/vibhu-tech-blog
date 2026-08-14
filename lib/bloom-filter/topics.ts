import type {BloomTopic} from './types';
import {TOPICS_A} from './topics-a';
import {TOPICS_B} from './topics-b';
import {TOPICS_C} from './topics-c';

export const TOPICS: BloomTopic[] = [...TOPICS_A, ...TOPICS_B, ...TOPICS_C];
