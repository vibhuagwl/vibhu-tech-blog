import type {GitTopic} from './types';

export const TOPICS_C: GitTopic[] = [
  {
    id: 'pr',
    title: 'PR · CI/CD · Hooks · Signed Commits',
    badge: 'Quality',
    problem: 'Gate main so payment-service can’t merge red builds.',
    whenToUse: 'All shared repos; especially money paths.',
    whenAvoid: 'Client hooks as the only security control.',
    mermaid: `flowchart TD
  DEV --> BR[feature branch] --> PUSH --> PR
  PR --> CI[Compile · JUnit · Sonar · Security · Docker]
  CI --> REV[Review] --> MERGE --> DEPLOY
  COMMIT --> PRE[pre-commit lint/format]
  COMMIT --> MSG[commit-msg]
  PUSH2[pre-push] --> TESTS`,
    code: `git push → CI: Maven · JUnit · Sonar · SCA · image · deploy
Branch protection: required reviews, status checks, no force, linear history optional

Hooks: pre-commit / commit-msg / pre-push (local)
Server-side hooks / GitHub rulesets (enforced)

Signed commits (GPG/SSH): verified badge — policy for releases
git config commit.gpgsign true   # example; prefer org SSO signing guides

CODEOWNERS for payment-service/**
Fork: fetch upstream → rebase upstream/main → PR upstream`,
    failure: 'Relying only on local hooks — can be skipped with --no-verify.',
    production: 'Required checks + owners + signed releases + audited merges.',
    interview30s: 'PR + protected main + CI gates; hooks help locally; server rules enforce.',
    followUp: 'What belongs in pre-commit vs CI?',
    tradeoff: 'Strict gates vs emergency velocity (break-glass process).',
    memoryTrick: 'Local habit · Server law · CI proof.',
  },
  {
    id: 'scale',
    title: 'Monorepo · Sparse · LFS · Secrets · Submodules',
    badge: 'Scale',
    problem: '100+ services in one repo — clone and secret safety.',
    whenToUse: 'Large repos, binaries, shared libraries, secret incidents.',
    whenAvoid: 'Submodules for every shared JAR without strong ownership.',
    mermaid: `flowchart TD
  MONO[Repo] --> PAY & ACC & CUST & SHARED & INFRA
  SPARSE[sparse-checkout payment-service]
  LFS[Git LFS binaries]
  SEC[Secret committed] --> ROTATE --> REWRITE --> AUDIT`,
    code: `git sparse-checkout init --cone
git sparse-checkout set payment-service

git clone --filter=blob:none <url>     # partial clone
git clone --depth 1 <url>              # shallow CI — limited history ops

git lfs install
git lfs track "*.zip" "*.jar"
# Don't put large binaries in normal Git history

git submodule add <url> shared-lib
git submodule update --init --recursive
# Submodules = operational complexity

# SECRET IN HISTORY
# 1) Rotate/revoke credential IMMEDIATELY
# 2) Remove from history (BFG/filter-repo)
# 3) Audit access / force teammates re-clone
# 4) git revert alone does NOT unsink a leaked secret

.gitignore: target/ .idea/ *.iml .env application-local.yml
git rm --cached application-local.yml   # untrack already committed`,
    failure: 'Only reverting the secret commit and leaving key active.',
    production: 'Secret scanning in CI; pre-receive bans; sparse for monorepos.',
    interview30s: 'Scale with sparse/partial/LFS; secrets = rotate first then rewrite.',
    followUp: 'Shallow clone limits?',
    tradeoff: 'Monorepo atomicity vs clone/CI cost.',
    memoryTrick: 'Rotate before rewrite · Sparse before full clone.',
  },
  {
    id: 'incidents',
    title: 'Production Git Incidents',
    badge: 'War Room',
    problem: 'Bad release, wrong merge, lost work, diverged branch, multi-release hotfix.',
    whenToUse: 'Every Git-related production incident.',
    whenAvoid: 'Rewriting shared history as “rollback”.',
    mermaid: `flowchart TD
  BAD[Bad prod commit] --> ID[log/show] --> RV[revert] --> CI --> DEP --> MON
  WM[Wrong merge] --> VR[revert -m 1]
  LOST[reset --hard] --> RF[reflog] --> REC[recovery branch]
  DIV[diverged] --> FET[fetch] --> GRAPH --> MERGE_OR_REBASE
  HF[Hotfix H] --> CP1[v3] & CP2[v2] & CP3[v1]`,
    code: `# Bad production commit
git log --oneline
git show <bad>
git revert <bad>          # shared-safe
# CI → deploy → monitor
# App rollback ≠ DB rollback — design migrations separately

# Wrong merge on main
git log --graph --oneline --all
git revert -m 1 <merge-commit>   # keep first parent line; know parents!

# Lost after reset --hard
git reflog
git branch recovery <hash>

# Diverged local/remote
git fetch origin
git log --oneline --graph --decorate --all
# choose merge vs rebase per sharing policy

# Conflicts on release: understand business timeout value, not random ours/theirs

# Errors: non-fast-forward → fetch+integrate
# detached HEAD → switch -c if work matters
# auth failed → SSH/token
# rejected push → remote moved`,
    failure: 'reset --hard origin/main on a shared machine mid-incident.',
    production: 'Incident runbook: identify → revert → deploy → monitor → RCA.',
    interview30s: 'Shared = revert; lost = reflog; merge mistake = revert -m; hotfix = cherry-pick matrix.',
    followUp: 'Force-push during incident — ever OK?',
    tradeoff: 'Speed of reset vs audit trail of revert.',
    memoryTrick: 'Revert ships · Reflog finds · Cherry-pick ports.',
  },
];
