import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import properties from 'highlight.js/lib/languages/properties';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import plaintext from 'highlight.js/lib/languages/plaintext';
import diff from 'highlight.js/lib/languages/diff';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import gradle from 'highlight.js/lib/languages/gradle';
import kotlin from 'highlight.js/lib/languages/kotlin';

let registered = false;

function ensureRegistered() {
  if (registered) return;
  hljs.registerLanguage('java', java);
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('html', xml);
  hljs.registerLanguage('yaml', yaml);
  hljs.registerLanguage('yml', yaml);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('shell', bash);
  hljs.registerLanguage('sh', bash);
  hljs.registerLanguage('zsh', bash);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('markdown', markdown);
  hljs.registerLanguage('md', markdown);
  hljs.registerLanguage('properties', properties);
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('js', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('ts', typescript);
  hljs.registerLanguage('tsx', typescript);
  hljs.registerLanguage('jsx', javascript);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('py', python);
  hljs.registerLanguage('plaintext', plaintext);
  hljs.registerLanguage('text', plaintext);
  hljs.registerLanguage('diff', diff);
  hljs.registerLanguage('dockerfile', dockerfile);
  hljs.registerLanguage('docker', dockerfile);
  hljs.registerLanguage('gradle', gradle);
  hljs.registerLanguage('kotlin', kotlin);
  hljs.registerLanguage('kt', kotlin);
  registered = true;
}

/** Map common aliases / fence labels → highlight.js language ids */
export const LANG_ALIASES: Record<string, string> = {
  java: 'java',
  xml: 'xml',
  html: 'html',
  htm: 'html',
  yaml: 'yaml',
  yml: 'yaml',
  sql: 'sql',
  bash: 'bash',
  shell: 'bash',
  sh: 'bash',
  zsh: 'bash',
  console: 'bash',
  terminal: 'bash',
  json: 'json',
  markdown: 'markdown',
  md: 'markdown',
  properties: 'properties',
  props: 'properties',
  javascript: 'javascript',
  js: 'javascript',
  jsx: 'javascript',
  typescript: 'typescript',
  ts: 'typescript',
  tsx: 'typescript',
  python: 'python',
  py: 'python',
  plaintext: 'plaintext',
  text: 'plaintext',
  txt: 'plaintext',
  diff: 'diff',
  dockerfile: 'dockerfile',
  docker: 'dockerfile',
  gradle: 'gradle',
  kotlin: 'kotlin',
  kt: 'kotlin',
  spring: 'java',
  pom: 'xml',
  mdx: 'markdown',
  git: 'bash',
};

const AUTO_SUBSET = [
  'java',
  'xml',
  'yaml',
  'sql',
  'bash',
  'json',
  'javascript',
  'typescript',
  'python',
  'properties',
  'markdown',
  'dockerfile',
  'gradle',
  'kotlin',
  'diff',
];

export function normalizeLanguage(input?: string | null): string | undefined {
  ensureRegistered();
  if (!input) return undefined;
  const key = input.trim().toLowerCase().replace(/^language-/, '');
  return LANG_ALIASES[key] ?? (hljs.getLanguage(key) ? key : undefined);
}

/** Infer language from a panel title like "Java sketch" or "bash" */
export function languageFromTitle(title?: string | null): string | undefined {
  if (!title) return undefined;
  const t = title.toLowerCase();
  for (const [alias, lang] of Object.entries(LANG_ALIASES)) {
    if (alias.length < 2) continue;
    if (new RegExp(`\\b${alias}\\b`, 'i').test(t)) return lang;
  }
  return undefined;
}

function escapeHtml(code: string) {
  return code.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

export type HighlightResult = {html: string; language: string};

export function highlightCode(code: string, language?: string | null): HighlightResult {
  ensureRegistered();
  const raw = code.replace(/\n$/, '');
  const normalized = normalizeLanguage(language);

  try {
    if (normalized && normalized !== 'plaintext' && hljs.getLanguage(normalized)) {
      const result = hljs.highlight(raw, {language: normalized, ignoreIllegals: true});
      return {html: result.value, language: normalized};
    }
    const auto = hljs.highlightAuto(raw, AUTO_SUBSET);
    if (auto.language && (auto.relevance ?? 0) >= 3) {
      return {html: auto.value, language: auto.language};
    }
    return {html: escapeHtml(raw), language: 'plaintext'};
  } catch {
    return {html: escapeHtml(raw), language: normalized ?? 'plaintext'};
  }
}

export function languageLabel(language: string) {
  if (!language || language === 'plaintext') return 'code';
  return language;
}
