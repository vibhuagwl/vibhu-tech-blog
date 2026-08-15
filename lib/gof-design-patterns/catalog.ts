import type {PatternCard} from './types';
import {CREATIONAL_PATTERNS} from './creational';
import {STRUCTURAL_PATTERNS} from './structural';
import {BEHAVIORAL_PATTERNS} from './behavioral';
import {MASTER_STORY} from '@/lib/design-patterns-stories';

export type PatternGroup = {
  id: string;
  part: number;
  title: string;
  lead: string;
  patterns: PatternCard[];
};

export const PATTERN_GROUPS: PatternGroup[] = [
  {
    id: 'creational',
    part: 1,
    title: 'Creational (5)',
    lead: 'How the bank is allowed to create objects — rails, kits, forms, templates, the one calendar.',
    patterns: CREATIONAL_PATTERNS,
  },
  {
    id: 'structural',
    part: 2,
    title: 'Structural (7)',
    lead: 'How the bank is wired — doors, coats, translators, trees, shared catalogs, guards.',
    patterns: STRUCTURAL_PATTERNS,
  },
  {
    id: 'behavioral',
    part: 3,
    title: 'Behavioral (11)',
    lead: 'How the bank talks and decides — pipelines, events, lifecycle, algorithms, reports.',
    patterns: BEHAVIORAL_PATTERNS,
  },
];

export const ALL_PATTERNS: PatternCard[] = PATTERN_GROUPS.flatMap((g) => g.patterns);

export const MEMORY_STORY = MASTER_STORY;

export const GOF_ASCII = `
                    ┌──────────── GoF 23 ────────────┐
 Creational (5)     │ Singleton Factory AbstractFactory │
                    │ Builder Prototype                 │
 Structural (7)     │ Adapter Bridge Composite          │
                    │ Decorator Facade Flyweight Proxy  │
 Behavioral (11)    │ Chain Command Interpreter Iterator│
                    │ Mediator Memento Observer State   │
                    │ Strategy TemplateMethod Visitor   │
                    └───────────────────────────────────┘
         One Meridian Bank payment threads all 23
`;

export const LAB_RUNBOOK = [
  'cd java-design-patterns-real-world && mvn -q test',
  'mvn -q exec:java -Dexec.mainClass=com.example.designpatterns.DesignPatternDemo',
  'Open Deep lab → on any card for the matching *Demo.java in the source explorer',
  'Revision stories + mock interview linked from /design-patterns',
];
