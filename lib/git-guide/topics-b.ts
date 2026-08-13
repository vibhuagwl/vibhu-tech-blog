import type {GitTopic} from './types';

export const TOPICS_B: GitTopic[] = [
  {
    id: 'undo',
    title: 'Reset · Revert · Restore · Conflicts',
    badge: 'Undo',
    problem: 'Undo the wrong thing without destroying shared history.',
    whenToUse: 'Local cleanup → reset/restore; shared bad commit → revert.',
    whenAvoid: '`reset --hard` on shared/prod branches.',
    mermaid: `flowchart TD
  U[Undo?] --> L{Shared?}
  L -->|No local| RES[restore / reset]
  L -->|Yes| REV[git revert]
  Soft[reset --soft] --> K1[keep staged]
  Mix[reset mixed] --> K2[keep files unstaged]
  Hard[reset --hard] --> DEL[discard worktree]`,
    code: `# Conflict markers in file:
# <<<<<<< HEAD
# timeout = 5;
# =======
# timeout = 10;
# >>>>>>> feature
# Resolve business intent → git add → continue

git merge --abort | git rebase --abort | git cherry-pick --abort

git reset --soft HEAD~1   # undo commit, keep staged
git reset HEAD~1          # mixed: unstage, keep files
git reset --hard HEAD~1   # DANGER: discards local work

git revert <commit>       # NEW inverse commit — safe on shared
# Bad prod deploy: identify → revert → CI → deploy → monitor

git restore file.java
git restore --staged file.java

# Modern: switch=branches, restore=files (checkout did both)`,
    failure: 'Choosing “ours/theirs” without understanding payment behavior.',
    production: 'Prefer revert on main; reset only private; abort when unsure.',
    interview30s: 'reset moves/refwrites locally; revert adds undo commit; restore fixes files.',
    followUp: 'revert -m 1 on a merge commit?',
    tradeoff: 'History rewrite cleanliness vs auditability.',
    memoryTrick: 'Local reset · Shared revert · Files restore.',
  },
  {
    id: 'recover',
    title: 'Reflog · Lost Commits · Detached HEAD',
    badge: 'Recover',
    problem: '`reset --hard` — “where did my commit go?”',
    whenToUse: 'After accidental reset/rebase/checkout when work “vanished”.',
    whenAvoid: 'Assuming remote still has it — check reflog first locally.',
    mermaid: `flowchart TD
  LOST[reset --hard] --> RL[git reflog]
  RL --> HASH[find prior HEAD]
  HASH --> BR[git branch recovery HASH]
  BR --> INSPECT[log / show]
  DET[detached HEAD] --> NEW[switch -c recovery-branch]`,
    code: `git reflog
# HEAD@{0} reset
# HEAD@{1} commit ...
git reset --hard HEAD@{2}          # or safer:
git branch recovery <hash>
git log recovery
git show <hash>

# Detached HEAD (inspecting old commit)
git switch --detach <commit>
git switch -c recovery-branch      # keep work

# fsck / dangling objects — investigate, don't gc during recovery
git fsck
# git gc — maintenance, not first recovery step`,
    failure: 'More resets before creating a recovery branch.',
    production: 'Teach reflog in onboarding; expire policies exist — act soon.',
    interview30s: 'Reflog tracks local HEAD movements; branch the hash before more surgery.',
    followUp: 'Does reflog recover uncommitted deleted files?',
    tradeoff: 'Local-only recovery vs needing remote backups.',
    memoryTrick: 'Reflog = time machine for HEAD.',
  },
  {
    id: 'debug',
    title: 'Blame · Bisect · log -S / -G',
    badge: 'Debug',
    problem: 'p95 jumped to 5s — which commit did it?',
    whenToUse: 'Regressions, mysterious line changes, string introduction.',
    whenAvoid: 'Using blame to shame — use it to find the change.',
    mermaid: `flowchart TD
  BUG[Prod bug] --> LINE[suspicious line]
  LINE --> BL[git blame]
  BL --> SH[git show]
  SH --> PR[read PR]
  REG[A good … D bad] --> BI[git bisect]
  BI --> MID[test middle]
  MID --> GB[good/bad] --> BI`,
    code: `git blame PaymentService.java
git show <commit>

git log -S"timeout" --oneline          # pickaxe: count change of string
git log -G"timeout.*seconds" --oneline # regex on diff

git bisect start
git bisect bad                 # current broken
git bisect good <known-good>
# test → git bisect good|bad → repeat
git bisect reset

# Performance: A 200ms … D 5s → bisect + automated test script`,
    failure: 'Stopping at author name instead of the PR rationale.',
    production: 'Bisect scripts in CI for flaky/perf gates when feasible.',
    interview30s: 'Blame finds line history; -S/-G find string birth; bisect binary-searches bad commit.',
    followUp: 'Automate bisect with a script?',
    tradeoff: 'Bisect time vs manual log archaeology.',
    memoryTrick: 'Blame line · Pickaxe string · Bisect range.',
  },
  {
    id: 'stash',
    title: 'Stash · Worktree',
    badge: 'Context',
    problem: 'Mid-feature when a P1 hotfix arrives — don’t lose WIP.',
    whenToUse: 'Quick context switch; parallel hotfix without stash hell.',
    whenAvoid: 'Long-lived stash as backup (easy to forget/drop).',
    mermaid: `flowchart TD
  FEAT[Feature A WIP] --> ST[stash]
  ST --> HF[hotfix branch]
  HF --> DONE[done]
  DONE --> POP[stash pop]
  REPO[Repo] --> W1[worktree feature]
  REPO --> W2[worktree hotfix]
  REPO --> W3[worktree release]`,
    code: `git stash push -m "payment WIP"
git stash list
git stash apply   # keep stash
git stash pop     # apply + drop
git stash drop

# Better for parallel work:
git worktree add ../payment-hotfix hotfix/payment
git worktree list
git worktree remove ../payment-hotfix

# Feature + urgent hotfix + no stash juggling`,
    failure: 'stash pop conflicts then losing the stash entry.',
    production: 'Prefer worktrees for long hotfix + feature parallelization.',
    interview30s: 'Stash parks WIP; worktree checks out another branch in a second directory.',
    followUp: 'stash include untracked?',
    tradeoff: 'Stash simplicity vs worktree clarity.',
    memoryTrick: 'Stash = pocket · Worktree = second desk.',
  },
  {
    id: 'release',
    title: 'Tags · Release Branches · GitFlow vs Trunk',
    badge: 'Release',
    problem: 'Mark production v2.5.0 and support hotfixes.',
    whenToUse: 'Immutable release markers; coordinated QA/UAT lines.',
    whenAvoid: 'Moving tags after customers consumed them.',
    mermaid: `flowchart TD
  MAIN[main] --> REL[release/2.0]
  REL --> QA --> UAT --> TAG[v2.0.0] --> PROD
  MAIN --> FEAT[feature/*]
  GF[GitFlow: develop/release/hotfix]
  TB[Trunk: short-lived features + flags]`,
    code: `git tag -a v2.5.0 -m "Production release 2.5.0"
git push origin v2.5.0

# GitFlow: main + develop + feature + release + hotfix
# Trunk-based: main + short features + feature flags + CI
# Many orgs: trunk-ish + release branches for support windows

# Expand/contract DB migrations with Git:
# Expand → deploy compatible app → migrate → use → contract later
# Git revert ≠ automatic DB downgrade`,
    failure: 'Retagging v2.5.0 to a different commit in the wild.',
    production: 'Tag from CI; sign tags; protect release branches.',
    interview30s: 'Tags mark releases; choose GitFlow vs trunk by release cadence and support needs.',
    followUp: 'Annotated vs lightweight tags?',
    tradeoff: 'Release-branch overhead vs trunk speed.',
    memoryTrick: 'Tag = release stamp · Branch = moving line.',
  },
];
