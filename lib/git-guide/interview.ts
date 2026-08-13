import type {InterviewQ} from './types';

export const SENIOR: InterviewQ[] = [
  {id:'s1',topic:'Senior',question:'Merge vs rebase?',answer30s:'Merge preserves history/markers; rebase rewrites private ancestry for linear history.',answer2m:'Never casual public rebase.',followUps:['Interactive rebase?']},
  {id:'s2',topic:'Senior',question:'Reset vs revert?',answer30s:'Reset moves local refs (rewrites); revert adds undo commit — safe on shared.',answer2m:'soft/mixed/hard.',followUps:['When hard?'],trick:'Always reset main to undo.'},
  {id:'s3',topic:'Senior',question:'Fetch vs pull?',answer30s:'Fetch downloads; pull = fetch + merge/rebase. Prefer fetch+decide.',answer2m:'--ff-only.',followUps:['pull --rebase?']},
  {id:'s4',topic:'Senior',question:'Why --force-with-lease?',answer30s:'Force push that refuses if remote moved unexpectedly — safer than --force.',answer2m:'Still avoid on protected branches.',followUps:['When legitimately needed?']},
  {id:'s5',topic:'Senior',question:'Recover after reset --hard?',answer30s:'git reflog → find hash → branch recovery → inspect.',answer2m:'Act before reflog expiry.',followUps:['Uncommitted files?']},
  {id:'s6',topic:'Senior',question:'Cherry-pick for hotfix?',answer30s:'Copy patch as new commit onto release line; test each target.',answer2m:'Multi-version matrix.',followUps:['Conflicts?']},
  {id:'s7',topic:'Senior',question:'How does bisect work?',answer30s:'Binary search good..bad commits by testing midpoints.',answer2m:'Automate with script.',followUps:['log -S vs bisect?']},
  {id:'s8',topic:'Senior',question:'Detached HEAD?',answer30s:'HEAD points at commit not branch tip; create branch to keep work.',answer2m:'switch --detach.',followUps:['Why happens?']},
  {id:'s9',topic:'Senior',question:'Resolve merge conflicts?',answer30s:'Understand both intents, edit, add, continue; abort if unsure.',answer2m:'Payment timeout example.',followUps:['ours/theirs trap?']},
  {id:'s10',topic:'Senior',question:'add -p why?',answer30s:'Stage only relevant hunks — keep commits focused.',answer2m:'Avoid debug+fix mix.',followUps:['Partial commit review?']},
];

export const ARCHITECT: InterviewQ[] = [
  {id:'a1',topic:'Architect',question:'Git workflow for 100+ microservices?',answer30s:'Trunk or release trains, short features, CODEOWNERS, protected mains, CI per path, sparse clones.',answer2m:'Mono vs multi-repo tradeoffs.',followUps:['Ownership?']},
  {id:'a2',topic:'Architect',question:'GitFlow vs trunk-based?',answer30s:'GitFlow = long release/hotfix structure; trunk = short features + flags + fast CI.',answer2m:'Support windows may still need release branches.',followUps:['Hotfix path?']},
  {id:'a3',topic:'Architect',question:'Production rollback with Git?',answer30s:'Revert bad commit(s) → CI → deploy artifact; don’t rewrite main. Plan DB separately.',answer2m:'Expand/contract.',followUps:['Tag previous release?']},
  {id:'a4',topic:'Architect',question:'Secret committed and pushed?',answer30s:'Rotate immediately; history rewrite; audit; scanning; educate. Revert alone insufficient.',answer2m:'Incident timeline.',followUps:['Pre-receive hooks?']},
  {id:'a5',topic:'Architect',question:'Monorepo scale?',answer30s:'Sparse checkout, partial clone, path CI, CODEOWNERS, commit-graph.',answer2m:'LFS for binaries.',followUps:['Shallow clone CI limits?']},
  {id:'a6',topic:'Architect',question:'Branch protection design?',answer30s:'Required reviews/checks, no force, signed commits optional, CODEOWNERS, break-glass.',answer2m:'Payment-service rules.',followUps:['Emergency hotfix?']},
  {id:'a7',topic:'Architect',question:'Wrong merge to main in prod?',answer30s:'Investigate graph; git revert -m 1; CI; deploy; RCA.',answer2m:'Parent selection.',followUps:['Re-merge later?']},
  {id:'a8',topic:'Architect',question:'Hotfix across v1–v3?',answer30s:'Land fix; cherry-pick per release; test independently; monitor each.',answer2m:'Conflict policy.',followUps:['Back-merge?']},
  {id:'a9',topic:'Architect',question:'Auditability requirements?',answer30s:'Signed tags/commits, protected history, PR records, no silent rewrites of prod lines.',answer2m:'Compliance angle.',followUps:['force-with-lease org-wide?']},
  {id:'a10',topic:'Architect',question:'Git vs deployment systems?',answer30s:'Git stores source history; CD promotes immutable artifacts; don’t equate git reset with undeploy.',answer2m:'Artifact provenance.',followUps:['Tag ↔ image digest?']},
];

export const RAPID_QS = [
  'What is HEAD?',
  'origin vs upstream?',
  'soft vs mixed vs hard?',
  'stash apply vs pop?',
  'annotated tag why?',
  'pull --ff-only meaning?',
  'rebase -i squash vs fixup?',
  'worktree use case?',
  'gitignore already tracked file?',
  'non-fast-forward fix?',
  'git clean -n vs -f?',
  'log -S vs -G?',
  'submodule pain?',
  'shallow clone downside?',
  'signed commit purpose?',
];

export const RAPID: InterviewQ[] = RAPID_QS.map((q, i) => ({
  id: `r${i + 1}`,
  topic: 'Rapid',
  question: q,
  answer30s: 'See cheat / topic card.',
  answer2m: 'Give Spring payment example.',
  followUps: ['Common mistake?'],
}));

export const ALL = [...SENIOR, ...ARCHITECT, ...RAPID];
