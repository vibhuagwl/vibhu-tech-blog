import type {GitTopic} from './types';

export const TOPICS_A: GitTopic[] = [
  {
    id: 'daily',
    title: 'Daily Development Workflow',
    badge: 'Core',
    problem: 'Ship a payment-validation feature without wrecking main.',
    whenToUse: 'Every feature/bugfix day.',
    whenAvoid: 'Committing untested WIP to protected branches.',
    mermaid: `flowchart TD
  P[Pull latest] --> B[Create branch]
  B --> C[Code + tests]
  C --> S[status / diff]
  S --> A[add / add -p]
  A --> CM[commit]
  CM --> F[fetch]
  F --> R[rebase / merge]
  R --> PUSH[push -u]
  PUSH --> PR[Pull Request]`,
    code: `git switch main
git pull --ff-only

git switch -c feature/payment-validation

git status
git diff
git add -p src/   # stage only the bugfix hunk
git commit -m "Add payment validation"

git fetch origin
git rebase origin/main
git push -u origin feature/payment-validation

# Prefer fetch + inspect over blind pull
git fetch origin
git log HEAD..origin/main --oneline`,
    failure: 'Blind `git pull` creates surprise merge commits on a dirty tree.',
    production: 'Branch protection + required checks before merge to main.',
    interview30s: 'ff-only main → short feature branch → add -p → fetch → rebase private → push → PR.',
    followUp: 'When is amend safe?',
    tradeoff: 'Rebase cleanliness vs shared-branch rewrite risk.',
    memoryTrick: 'Inspect → stage hunks → commit → fetch → integrate → push.',
  },
  {
    id: 'inspect',
    title: 'Status · Diff · Log · Show',
    badge: 'Inspect',
    problem: 'Know exactly what will ship before you push.',
    whenToUse: 'Before every add/commit/push and during review.',
    whenAvoid: 'Committing without reading `diff --staged`.',
    mermaid: `flowchart LR
  F[File] --> U[Untracked]
  F --> M[Modified]
  F --> ST[Staged]
  F --> CM[Committed]
  BR[Branch] --> AH[Ahead] & BH[Behind] & DV[Diverged]`,
    code: `git status

git diff              # worktree vs index
git diff --staged     # index vs HEAD
git diff HEAD         # worktree+index vs HEAD
git diff main..feature/payment

git log --oneline --decorate --graph --all   # MANDATORY interview cmd

git show <commit>
git show --stat <commit>
git show --name-only <commit>

# File lifecycle: Untracked → Modified → Staged → Committed
# Branch: Ahead / Behind / Diverged vs upstream`,
    failure: 'Staging secrets with `git add .` without status/diff.',
    production: 'Require PR diff review; protect main from direct push.',
    interview30s: 'status shows state; diff scopes changes; graph log shows topology; show explains one commit.',
    followUp: 'diff staged vs unstaged?',
    tradeoff: 'Verbose logs vs --oneline scanability.',
    memoryTrick: 'Status asks · Diff proves · Log maps · Show explains.',
  },
  {
    id: 'branch',
    title: 'Branch · Merge · Rebase · Interactive',
    badge: 'Integrate',
    problem: 'Integrate feature/payment onto main without rewriting public history.',
    whenToUse: 'Private feature cleanup → rebase; shared integration → merge.',
    whenAvoid: 'Casual rebase of origin/main or shared release branches.',
    mermaid: `flowchart TD
  subgraph before
  A-->B-->C[main]
  B-->D-->E[feature]
  end
  subgraph after_rebase
  A2[A]-->B2[B]-->C2[C]-->D2[D']-->E2[E']
  end
  M[MERGE preserves] --> MC[merge commit]
  R[REBASE rewrites] --> LIN[linear history]`,
    code: `git branch -a
git switch -c feature/payment
git switch main

# Fast-forward when main has no unique commits
git merge feature/payment

# Non-FF creates merge commit when histories diverged

git switch feature
git rebase main                 # private only
git rebase -i HEAD~5            # pick/reword/edit/squash/fixup/drop

# NEVER casually rebase shared/public history
# Squash merge via PR is a team policy choice

| Scenario | Prefer |
| Shared branch | Merge |
| Private feature | Rebase |
| Need integration marker | Merge |
| Public history rewrite | Avoid |`,
    failure: 'Rebase + force-push over teammates’ commits.',
    production: 'Document branch policy; protect main; use --force-with-lease if rewrite required.',
    interview30s: 'Merge preserves; rebase rewrites private history into linear form; never casual public rebase.',
    followUp: 'Interactive squash of 5 messy commits?',
    tradeoff: 'Linear history vs truthful merge topology.',
    memoryTrick: 'Private = rebase · Shared = merge · Public = hands off.',
  },
  {
    id: 'cherry',
    title: 'Cherry-pick · Production Hotfix',
    badge: 'Hotfix',
    problem: 'Timeout fix landed on main — need it on release/1.9 today.',
    whenToUse: 'Port a known-good commit to another line without full merge.',
    whenAvoid: 'Cherry-picking huge unrelated stacks; skipping per-branch tests.',
    mermaid: `flowchart TD
  BUG[Prod payment bug] --> HF[hotfix branch]
  HF --> FIX[Fix + test]
  FIX --> DEP[Deploy]
  DEP --> CP[cherry-pick to release lines]
  MAIN[main H123] -->|cherry-pick| R19[release/1.9]`,
    code: `git switch main && git pull --ff-only
git switch -c hotfix/payment-timeout
# fix + tests
git commit -am "Fix payment timeout"
git push -u origin hotfix/payment-timeout
# PR → main (or release) per policy

# Port to older release
git switch release/1.9
git cherry-pick H123   # creates NEW commit with same patch

# Across v3/v2/v1: cherry-pick H independently; test each branch
# Conflict? resolve → git add → git cherry-pick --continue
# Abort: git cherry-pick --abort`,
    failure: 'Assuming cherry-pick is identical SHA — it’s a new commit.',
    production: 'Hotfix checklist: blast radius, DB compat, cherry-pick matrix, monitor.',
    interview30s: 'Cherry-pick copies the change as a new commit onto another branch.',
    followUp: 'Hotfix then back-merge vs cherry-pick?',
    tradeoff: 'Surgical port vs duplicate commit noise.',
    memoryTrick: 'Same patch · new passport (SHA).',
  },
  {
    id: 'sync',
    title: 'Fetch · Pull · Push · Force-with-lease',
    badge: 'Sync',
    problem: 'Remote moved — don’t clobber teammates.',
    whenToUse: 'Before integrate/push; after overnight remote changes.',
    whenAvoid: '`git push --force` on shared branches.',
    mermaid: `flowchart TD
  F[git fetch] --> DL[Download refs]
  DL --> DEC[Inspect + decide]
  P[git pull] --> F2[fetch] --> MR[merge/rebase]
  PUSH[push -u] --> UP[set upstream]
  FF[push --force] --> DANGER
  FWL[push --force-with-lease] --> SAFE[refuses if remote moved]`,
    code: `git fetch origin
git log HEAD..origin/main --oneline

git pull --ff-only            # refuse implicit merge
git pull --rebase origin main # when policy allows

git push -u origin feature/payment

# Force only when rewriting YOUR private branch after rebase
git push --force-with-lease origin feature/payment
# --force is dangerous; lease checks remote hasn’t unexpected commits

git remote -v
git remote show origin`,
    failure: 'Force-push main after rebase → lost teammate commits.',
    production: 'Deny force on protected branches; require lease locally.',
    interview30s: 'Fetch downloads; pull integrates; lease is the only semi-safe force.',
    followUp: 'non-fast-forward rejected — steps?',
    tradeoff: 'Convenience of pull vs control of fetch+decide.',
    memoryTrick: 'Fetch looks · Pull acts · Lease guards force.',
  },
];
