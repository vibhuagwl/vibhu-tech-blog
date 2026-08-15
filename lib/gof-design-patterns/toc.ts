import type {TocItem} from './types';

export const GOF_TOC: TocItem[] = [
  {id: 'overview', label: '00. Overview'},
  {id: 'creational', label: '01. Creational (5)'},
  {id: 'structural', label: '02. Structural (7)'},
  {id: 'behavioral', label: '03. Behavioral (11)'},
  {id: 'matrix', label: '04. Decision matrix'},
  {id: 'twins', label: '05. Confused twins'},
  {id: 'interview', label: '06. Interview bank'},
  {id: 'lab', label: '07. Runnable lab'},
];

export const MEMORY_SENTENCE =
  'One Meridian Bank rent payment · 23 GoF patterns · Why → Architecture → Code → Failures → Ops → Interview.';

export const VERSION_NOTE =
  'Java 21 demos in java-design-patterns-real-world/ · Spring notes where DI replaces hand-rolled wiring · same UX as Microservices Patterns.';
