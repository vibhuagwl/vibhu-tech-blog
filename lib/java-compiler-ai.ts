import type {JavaIdeFile} from '@/lib/java-compiler-project';

export type AiActionId=
  | 'explain'
  | 'fix'
  | 'optimize'
  | 'generate'
  | 'test'
  | 'refactor';

export type AiSuggestion={
  action:AiActionId;
  title:string;
  summary:string;
  cursorPrompt:string;
  proposedFiles:JavaIdeFile[];
};

function activeOrSelection(file:JavaIdeFile,selection?:string){
  return (selection && selection.trim()) || file.content;
}

export function buildAiSuggestion(input:{
  action:AiActionId;
  file:JavaIdeFile;
  files:JavaIdeFile[];
  selection?:string;
  compileStderr?:string;
}):AiSuggestion{
  const code=activeOrSelection(input.file,input.selection);
  const classMatch=code.match(/public\s+class\s+(\w+)/);
  const className=classMatch?.[1] || 'Main';
  const pkgMatch=code.match(/^\s*package\s+([\w.]+)\s*;/m);
  const pkg=pkgMatch?.[1];

  if(input.action==='explain'){
    return {
      action:'explain',
      title:'Explain Code',
      summary:'Structured explanation of the current Java file. No code changes proposed — review the summary, or copy the Cursor prompt for a deeper dive.',
      cursorPrompt:`Explain this Java code for a senior interview. Cover purpose, flow, edge cases, and complexity.\n\nFile: ${input.file.path}\n\n\`\`\`java\n${code}\n\`\`\``,
      proposedFiles:input.files.map((f)=>({...f})),
    };
  }

  if(input.action==='fix'){
    const stderr=input.compileStderr || '';
    let fixed=code;
    let note='Applied common syntax fixes where possible.';

    if(/';\s*expected/.test(stderr) || /reached end of file while parsing/.test(stderr)){
      if(!fixed.trimEnd().endsWith('}') && (fixed.match(/\{/g)||[]).length>(fixed.match(/\}/g)||[]).length){
        fixed=`${fixed.trimEnd()}\n}\n`;
        note='Added a missing closing brace based on the compiler diagnostic.';
      }
    }
    if(/cannot find symbol/.test(stderr) && /Greeter/.test(stderr) && !/import/.test(fixed)){
      note='Compiler reports a missing symbol. Open related files or generate the missing type; no automatic overwrite without your review.';
    }
    if(fixed===code && stderr){
      // Soft formatting / semicolon repair for obvious println mistakes
      fixed=fixed.replace(/System\.out\.println\(([^;]*)\)(?!\s*;)/g,'System.out.println($1);');
      if(fixed!==code) note='Inserted missing semicolons after println statements.';
      else note='Could not auto-patch safely. Copy the Cursor prompt to fix with full context.';
    }

    return {
      action:'fix',
      title:'Fix Error',
      summary:note,
      cursorPrompt:`Fix this Java compile/runtime error. Return only the corrected file content.\n\nDiagnostics:\n${stderr || '(none)'}\n\nFile: ${input.file.path}\n\n\`\`\`java\n${code}\n\`\`\``,
      proposedFiles:input.files.map((f)=>f.path===input.file.path?{...f,content:fixed}:{...f}),
    };
  }

  if(input.action==='optimize'){
    let optimized=code;
    // Tiny safe micro-opt: use text blocks hint via comment + StringBuilder for naive loops
    if(/for\s*\(.*\)\s*\{\s*[^}]*\+\s*=/.test(code) && !/StringBuilder/.test(code)){
      optimized=`${code.trimEnd()}\n\n// Suggested: prefer StringBuilder for repeated string concatenation in hot loops.\n`;
    }else{
      optimized=`${code.trimEnd()}\n\n// Optimization notes:\n// 1) Prefer immutable inputs where possible\n// 2) Avoid work in hot loops\n// 3) Validate null/empty at boundaries\n`;
    }
    return {
      action:'optimize',
      title:'Optimize Code',
      summary:'Adds optimization notes (and safe hints). Review before applying.',
      cursorPrompt:`Optimize this Java code for clarity and performance. Keep behavior identical.\n\n\`\`\`java\n${code}\n\`\`\``,
      proposedFiles:input.files.map((f)=>f.path===input.file.path?{...f,content:optimized}:{...f}),
    };
  }

  if(input.action==='generate'){
    const generated=`package ${pkg || 'com.example.demo'};

public class ${className}Sample {
    public static int add(int a, int b) {
        return a + b;
    }

    public static void main(String[] args) {
        System.out.println(add(2, 3));
    }
}
`;
    const pathName=pkg
      ? `${pkg.replace(/\./g,'/')}/${className}Sample.java`
      : `${className}Sample.java`;
    return {
      action:'generate',
      title:'Generate Code',
      summary:`Creates ${pathName}. Review before applying.`,
      cursorPrompt:`Generate a small complementary Java class for this project around:\n\n\`\`\`java\n${code}\n\`\`\``,
      proposedFiles:[...input.files,{path:pathName,content:generated}],
    };
  }

  if(input.action==='test'){
    const testPkg=pkg || 'com.example.demo';
    const testPath=`${testPkg.replace(/\./g,'/')}/${className}Test.java`;
    const testContent=`package ${testPkg};

public class ${className}Test {
    public static void main(String[] args) {
        // Lightweight smoke test (no JUnit dependency required in this IDE sandbox)
        System.out.println("Running ${className}Test...");
        if (args.length > 0) {
            throw new IllegalStateException("unexpected args");
        }
        System.out.println("OK");
    }
}
`;
    return {
      action:'test',
      title:'Generate Unit Test',
      summary:`Adds ${testPath} as a runnable smoke test class. Review before applying.`,
      cursorPrompt:`Generate JUnit 5 tests for this Java class:\n\n\`\`\`java\n${code}\n\`\`\``,
      proposedFiles:[...input.files.filter((f)=>f.path!==testPath),{path:testPath,content:testContent}],
    };
  }

  // refactor
  const refactored=code
    .replace(/\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*args\s*\)/,'public static void main(String[] args)')
    .replace(/[ \t]+$/gm,'');
  return {
    action:'refactor',
    title:'Refactor Code',
    summary:'Normalizes main signature spacing and trims trailing whitespace. Review before applying.',
    cursorPrompt:`Refactor this Java code for readability without changing behavior:\n\n\`\`\`java\n${code}\n\`\`\``,
    proposedFiles:input.files.map((f)=>f.path===input.file.path?{...f,content:refactored}:{...f}),
  };
}
