import type {TocItem} from './types';

export const GIT_TOC: TocItem[] = [
  {id: 'overview', label: 'Mental Model'},
  {id: 'daily', label: 'Daily Workflow'},
  {id: 'inspect', label: 'Status · Diff · Log'},
  {id: 'branch', label: 'Branch · Merge · Rebase'},
  {id: 'cherry', label: 'Cherry-pick · Hotfix'},
  {id: 'sync', label: 'Fetch · Pull · Push'},
  {id: 'undo', label: 'Reset · Revert · Restore'},
  {id: 'recover', label: 'Reflog · Lost Commits'},
  {id: 'debug', label: 'Blame · Bisect · -S/-G'},
  {id: 'stash', label: 'Stash · Worktree'},
  {id: 'release', label: 'Tags · Release · Flow'},
  {id: 'pr', label: 'PR · CI/CD · Hooks'},
  {id: 'scale', label: 'Monorepo · LFS · Secrets'},
  {id: 'incidents', label: 'Production Incidents'},
  {id: 'architecture', label: 'Decision Tree'},
  {id: 'interview', label: 'Interview Mode'},
  {id: 'cheat', label: 'Cheat Sheet'},
];
