import fs from 'fs';
import path from 'path';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';

export type {DemoSourceFile, DemoTreeNode};

const DEMO_ROOT = path.join(process.cwd(), 'kafka-production');
const SKIP = new Set(['.git', 'node_modules', 'certificates']);
const TEXT_EXT = new Set([
  '.properties', '.yml', '.yaml', '.java', '.sh', '.md', '.json', '.xml', '.gitignore',
]);

function languageFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.java': return 'java';
    case '.yml':
    case '.yaml': return 'yaml';
    case '.sh': return 'bash';
    case '.md': return 'markdown';
    case '.properties': return 'properties';
    case '.xml': return 'xml';
    case '.json': return 'json';
    default: return 'text';
  }
}

function walk(dir: string, base = DEMO_ROOT): DemoSourceFile[] {
  const out: DemoSourceFile[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, '/');
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (TEXT_EXT.has(path.extname(full).toLowerCase()) || entry.name === '.gitignore') {
      const content = fs.readFileSync(full, 'utf8');
      out.push({
        path: rel,
        name: entry.name,
        language: languageFor(full),
        content,
        lines: content.split('\n').length,
      });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function buildTree(files: DemoSourceFile[]): DemoTreeNode[] {
  const root: DemoTreeNode[] = [];
  for (const f of files) {
    const parts = f.path.split('/');
    let level = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      let node = level.find((n) => n.name === part);
      if (!node) {
        node = isFile ? {name: part, path: f.path} : {name: part, children: []};
        level.push(node);
      }
      if (!isFile && node.children) level = node.children;
    }
  }
  return root;
}

export function listKafkaProductionFiles(): DemoSourceFile[] {
  return walk(DEMO_ROOT);
}

export function buildKafkaProductionTree(files: DemoSourceFile[]): DemoTreeNode[] {
  return buildTree(files);
}

export const DEFAULT_KAFKA_PRODUCTION_PATH = 'README.md';
