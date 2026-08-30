import fs from 'node:fs';
import path from 'node:path';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import {buildOAuthDemoTree} from '@/lib/oauth-demo-source';

export type {DemoSourceFile, DemoTreeNode};

const DEMO_ROOT = path.join(process.cwd(), 'secure-kafka');

const INCLUDE_EXT = new Set([
  '.java',
  '.xml',
  '.yml',
  '.yaml',
  '.md',
  '.sh',
  '.json',
  '.properties',
  '.txt',
  '.example',
]);

const SKIP_DIR = new Set(['target', '.git', 'node_modules', 'certificates']);

function languageFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.java':
      return 'java';
    case '.xml':
      return 'xml';
    case '.yml':
    case '.yaml':
      return 'yaml';
    case '.md':
      return 'markdown';
    case '.sh':
      return 'bash';
    case '.json':
      return 'json';
    case '.properties':
      return 'properties';
    default:
      return 'text';
  }
}

function walk(dir: string, base = DEMO_ROOT): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (SKIP_DIR.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (
      INCLUDE_EXT.has(path.extname(entry.name).toLowerCase()) ||
      entry.name === 'Dockerfile' ||
      entry.name === 'docker-compose.yml' ||
      entry.name === '.env.example'
    ) {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

export function listSecureKafkaFiles(): DemoSourceFile[] {
  if (!fs.existsSync(DEMO_ROOT)) return [];
  return walk(DEMO_ROOT)
    .sort((a, b) => a.localeCompare(b))
    .map((rel) => {
      const abs = path.join(DEMO_ROOT, rel);
      const content = fs.readFileSync(abs, 'utf8');
      return {
        path: rel,
        name: path.basename(rel),
        language: languageFor(rel),
        content,
        lines: content.length === 0 ? 0 : content.split(/\r?\n/).length,
      };
    });
}

export function buildSecureKafkaTree(files: DemoSourceFile[]): DemoTreeNode[] {
  return buildOAuthDemoTree(files);
}
