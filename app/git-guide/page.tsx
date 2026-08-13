import type {Metadata} from 'next';
import GitGuideHub from '@/components/git-guide/git-guide-hub';

export const metadata: Metadata = {
  title: 'Git Master Guide — Architect Production Commands',
  description:
    'Command-first Git guide for Staff/Architect interviews: rebase vs merge, reset vs revert, reflog, cherry-pick hotfixes, bisect, PR/CI, secrets, monorepos.',
};

export default function GitGuidePage() {
  return (
    <main>
      <GitGuideHub />
    </main>
  );
}
