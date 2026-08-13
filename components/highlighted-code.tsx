'use client';

import {useMemo} from 'react';
import {
  highlightCode,
  languageFromTitle,
  languageLabel,
  normalizeLanguage,
} from '@/lib/syntax-highlight';

type Props = {
  code: string;
  /** Fence / panel language; auto-detected when omitted */
  language?: string;
  /** Optional title used to hint language (e.g. "SQL sketch") */
  title?: string;
  className?: string;
  codeClassName?: string;
};

export default function HighlightedCode({
  code,
  language,
  title,
  className = '',
  codeClassName = '',
}: Props) {
  const {html, language: resolved} = useMemo(() => {
    const hinted = normalizeLanguage(language) ?? languageFromTitle(title);
    return highlightCode(code, hinted);
  }, [code, language, title]);

  return (
    <pre className={`syntax-pre m-0 overflow-x-auto ${className}`.trim()}>
      <code
        className={`hljs language-${resolved} font-mono syntax-code ${codeClassName}`.trim()}
        data-language={languageLabel(resolved)}
        dangerouslySetInnerHTML={{__html: html}}
      />
    </pre>
  );
}
