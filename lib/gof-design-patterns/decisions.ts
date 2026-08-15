import type {DecisionTree, MatrixRow} from './types';
import {CONFUSED_TWINS, PURPOSE_WALL} from '@/lib/design-patterns-stories';

export const DECISION_TREES: DecisionTree[] = [
  {
    id: 'create-or-not',
    title: 'Need a new object?',
    ascii: `Need object?
  ├─ type varies (UPI/NEFT) → Factory Method
  ├─ whole kit must match (IN/US) → Abstract Factory
  ├─ many optionals → Builder
  ├─ clone template → Prototype
  └─ truly one process global → Singleton (prefer Spring bean)`,
  },
  {
    id: 'wire-or-guard',
    title: 'Wiring shape?',
    ascii: `Foreign API shape? → Adapter
Many internals, one door? → Facade
Gate before real object? → Proxy
Extra coat always calls through? → Decorator
Two axes (channel×vendor)? → Bridge
Tree one/many same op? → Composite
Share tiny immutable? → Flyweight`,
  },
  {
    id: 'talk-or-decide',
    title: 'Behavior?',
    ascii: `Pipeline may stop? → Chain
Action is a queueable object? → Command
Tiny rule language? → Interpreter
Walk without exposing storage? → Iterator
Hub conversation? → Mediator
Snapshot/restore? → Memento
Broadcast event? → Observer
Lifecycle verbs? → State
Swap algorithm? → Strategy
Fixed skeleton? → Template Method
New report on stable types? → Visitor`,
  },
];

export const PATTERN_MATRIX: MatrixRow[] = PURPOSE_WALL.map((p) => ({
  pattern: p.name,
  problem: p.purpose,
  solution: p.purpose,
  tradeoff: 'See card trade-offs',
  interviewQ: `Explain ${p.name} with a payment example`,
}));

export const CHEAT_SHEET = PURPOSE_WALL.map((p) => `${p.name}: ${p.purpose}`).join('\n');

export const TWINS = CONFUSED_TWINS;
