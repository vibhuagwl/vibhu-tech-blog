export const RESET_REVERT = [
  {c:'reset',p:'Move branch/HEAD',rw:'Yes',shared:'Usually No'},
  {c:'revert',p:'Undo via new commit',rw:'No',shared:'Yes'},
  {c:'rebase',p:'Rewrite ancestry',rw:'Yes',shared:'Usually No'},
  {c:'cherry-pick',p:'Copy change',rw:'New commit',shared:'Yes w/ care'},
];

export const MERGE_REBASE = [
  {s:'Shared branch',p:'Merge'},
  {s:'Private feature',p:'Rebase'},
  {s:'Public history rewrite',p:'Avoid rebase'},
  {s:'Need integration marker',p:'Merge'},
  {s:'Clean local history',p:'Rebase / rebase -i'},
];

export const ERRORS = [
  {e:'non-fast-forward',m:'Remote has new commits',f:'fetch + integrate'},
  {e:'merge conflict',m:'Overlapping changes',f:'resolve + continue'},
  {e:'detached HEAD',m:'HEAD on commit not branch',f:'switch -c if keeping work'},
  {e:'rejected push',m:'Remote changed',f:'fetch/rebase/merge'},
  {e:'authentication failed',m:'Creds/SSH',f:'key/token/config'},
  {e:'unrelated histories',m:'Different roots',f:'deliberate merge only'},
];

export const TOP25 = [
  ['git status','Working/staging state','Skipping before commit'],
  ['git log --oneline --graph --all','Topology map','Only reading linear log'],
  ['git diff / --staged','Unstaged vs staged','Wrong scope'],
  ['git add -p','Stage hunks','add . secrets'],
  ['git commit / --amend','Record / fix last local','Amend after push'],
  ['git switch / branch','Move/create branches','Detached work lost'],
  ['git fetch','Download decide','Blind pull'],
  ['git pull --ff-only / --rebase','Safe integrate','Surprise merges'],
  ['git push / --force-with-lease','Publish / careful rewrite','--force on shared'],
  ['git merge / rebase / -i','Integrate / rewrite private','Rebase public'],
  ['git cherry-pick','Port hotfix','Untested target branch'],
  ['git revert','Shared undo','Reset on main'],
  ['git reset soft/mixed/hard','Local history move','hard on shared'],
  ['git restore','Fix files/staging','Confusion with reset'],
  ['git reflog','Recover HEAD','Assuming gone forever'],
  ['git stash / worktree','Context switch','Forgotten stash'],
  ['git blame / show','Line → commit','Blame as shame'],
  ['git bisect / log -S/-G','Find regression','Manual only on huge ranges'],
  ['git tag -a','Release marker','Moving published tags'],
];

export const CHEAT: [string, string][] = [
  ['DAILY', 'status · diff · add · commit · fetch · rebase · push'],
  ['INTEGRATE', 'merge · rebase · cherry-pick'],
  ['UNDO', 'restore · reset · revert'],
  ['RECOVER', 'reflog · branch recovery · fsck'],
  ['DEBUG', 'blame · show · log -S/-G · bisect'],
  ['TEMP', 'stash · worktree'],
  ['RELEASE', 'tag · release branch'],
  ['REMOTE', 'fetch · pull · push'],
];

export const GOLDEN = [
  'Inspect before changing',
  'Fetch before integrating',
  'Never blind reset --hard',
  'Never casual force-push shared',
  'Prefer --force-with-lease',
  'Prefer revert on shared history',
  'Rebase private carefully',
  'Resolve conflicts with business intent',
  'Reflog before assuming lost',
  'Tag production releases',
  'Small meaningful commits',
  'History rewrite ≠ prod rollback',
  'Rotate secrets immediately if leaked',
  'Test hotfixes per release branch',
  'Protect main/release',
  'Automate CI quality gates',
  'Git = history; CD = artifacts',
  'DB rollback designed separately',
];

export const DECISION = [
  {q:'Uncommitted file wrong?',yes:'git restore',no:'Continue'},
  {q:'Local commit not shared?',yes:'reset / amend / rebase -i',no:'Continue'},
  {q:'Shared commit bad?',yes:'git revert',no:'Continue'},
  {q:'Need commit from other branch?',yes:'cherry-pick',no:'Continue'},
  {q:'Lost commit after reset?',yes:'reflog → recovery branch',no:'Check remote'},
  {q:'Need history cleanup private?',yes:'rebase -i',no:'Avoid on public'},
];

export const SIXTY =
  'Git stores snapshots via working tree → index → local commits → remote. Daily: status/diff/add -p/commit, fetch before integrate, rebase private features, merge shared carefully. Undo shared with revert; recover with reflog; find bugs with blame/bisect/-S. Never force-push main; rotate secrets immediately.';

export const FIVE_MIN =
  'Whiteboard the four areas: develop (branch/commit/rebase), release (tag/cherry-pick/hotfix), recover (reflog/revert/reset), investigate (blame/bisect). Contrast merge vs rebase, reset vs revert, fetch vs pull, force vs force-with-lease. Map a payment hotfix across release lines and a bad-prod revert through CI. Call out DB migrations and secrets as separate from Git history tricks.';
