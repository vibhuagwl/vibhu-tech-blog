import {TOPICS_A} from './topics-a';
import {TOPICS_B} from './topics-b';
import {TOPICS_C} from './topics-c';
import {TOPICS_D} from './topics-d';
import type {TopicCard} from './types';

export const TOPICS: TopicCard[] = [...TOPICS_A, ...TOPICS_B, ...TOPICS_C, ...TOPICS_D];

export function topicById(id: string): TopicCard | undefined {
  return TOPICS.find((t) => t.id === id);
}
