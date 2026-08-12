'use client';

import dynamic from 'next/dynamic';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {Eraser,Loader2,Play,Square,Terminal} from 'lucide-react';
import {
  compileJavaProject,
  fetchJdkStatus,
  getJavaCompilerBaseUrl,
  runJavaProject,
  setJavaCompilerBaseUrl,
  stopJavaProcess,
  type JdkInfo,
} from '@/lib/java-compiler-client';
import {buildAiSuggestion,type AiActionId,type AiSuggestion} from '@/lib/java-compiler-ai';
import {
  createDefaultProject,
  detectMainClasses,
  pathToPackageHint,
  type JavaIdeFile,
} from '@/lib/java-compiler-project';
import ProjectExplorer from '@/components/java-compiler/project-explorer';
import ConsolePanel,{type ConsoleLine} from '@/components/java-compiler/console-panel';
import AiAssistPanel from '@/components/java-compiler/ai-assist-panel';

const MonacoJavaEditor=dynamic(()=>import('@/components/java-compiler/monaco-java-editor'),{
  ssr:false,
  loading:()=><div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">Loading editor…</div>,
});

function uid(){
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseJavacMarkers(stderr:string){
  const markers:{line:number;column:number;message:string;severity:'Error'|'Warning'}[]=[];
  const re=/:(\d+):(?:(\d+):)?\s*(error|warning):\s*(.+)/gi;
  let m:RegExpExecArray|null;
  while((m=re.exec(stderr))){
    markers.push({
      line:Number(m[1]),
      column:Number(m[2] || 1),
      severity:m[3].toLowerCase()==='warning'?'Warning':'Error',
      message:m[4],
    });
  }
  return markers;
}

export default function JavaIde(){
  const [files,setFiles]=useState<JavaIdeFile[]>(()=>createDefaultProject());
  const [activePath,setActivePath]=useState(files[0]?.path || '');
  const [selection,setSelection]=useState('');
  const [mainClass,setMainClass]=useState('com.example.demo.Main');
  const [jdk,setJdk]=useState<JdkInfo|null>(null);
  const [serverUrl,setServerUrl]=useState('http://127.0.0.1:3927');
  const [javaHome,setJavaHome]=useState('');
  const [lines,setLines]=useState<ConsoleLine[]>([]);
  const [busy,setBusy]=useState(false);
  const [markers,setMarkers]=useState<{line:number;column:number;message:string;severity:'Error'|'Warning'}[]>([]);
  const [lastStderr,setLastStderr]=useState('');
  const [suggestion,setSuggestion]=useState<AiSuggestion|null>(null);
  const [dark,setDark]=useState(false);

  const activeFile=files.find((f)=>f.path===activePath) || files[0];
  const mainClasses=useMemo(()=>detectMainClasses(files),[files]);

  const append=useCallback((kind:ConsoleLine['kind'],text:string)=>{
    setLines((prev)=>[...prev,{id:uid(),kind,text}]);
  },[]);

  const refreshJdk=useCallback(async ()=>{
    const status=await fetchJdkStatus(javaHome || undefined);
    setJdk(status.jdk);
    if(!status.jdk.available){
      append('system',status.jdk.error || 'JDK unavailable');
    }
  },[append,javaHome]);

  useEffect(()=>{
    setServerUrl(getJavaCompilerBaseUrl());
    const savedHome=window.localStorage.getItem('java-compiler-java-home');
    if(savedHome) setJavaHome(savedHome);
    setDark(document.documentElement.classList.contains('dark'));
    const obs=new MutationObserver(()=>{
      setDark(document.documentElement.classList.contains('dark'));
    });
    obs.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    return ()=>obs.disconnect();
  },[]);

  useEffect(()=>{
    void refreshJdk();
  },[refreshJdk]);

  useEffect(()=>{
    if(mainClasses.length && !mainClasses.includes(mainClass)){
      setMainClass(mainClasses[0]);
    }
  },[mainClasses,mainClass]);

  function updateActiveContent(content:string){
    setFiles((prev)=>prev.map((f)=>f.path===activePath?{...f,content}:f));
  }

  function onNewFile(){
    const rel=window.prompt('New Java file path (package folders with /)', 'com/example/demo/NewClass.java');
    if(!rel) return;
    const pathName=rel.replace(/^\/+/,'').replace(/\\/g,'/');
    if(!pathName.endsWith('.java')){
      window.alert('Path must end with .java');
      return;
    }
    if(files.some((f)=>f.path===pathName)){
      setActivePath(pathName);
      return;
    }
    const pkg=pathToPackageHint(pathName);
    const cls=pathName.split('/').pop()!.replace(/\.java$/,'');
    const content=pkg==='(default package)'
      ? `public class ${cls} {\n    public static void main(String[] args) {\n        System.out.println("${cls}");\n    }\n}\n`
      : `package ${pkg};\n\npublic class ${cls} {\n    public static void main(String[] args) {\n        System.out.println("${cls}");\n    }\n}\n`;
    setFiles((prev)=>[...prev,{path:pathName,content}]);
    setActivePath(pathName);
  }

  function clearConsole(){
    setLines([]);
    setMarkers([]);
  }

  async function onCompile(){
    setBusy(true);
    append('system','Compiling…');
    const result=await compileJavaProject({files,javaHome:javaHome || undefined});
    setBusy(false);
    if(result.jdk) setJdk(result.jdk);
    const err=result.stderr || result.error || '';
    setLastStderr(err);
    setMarkers(parseJavacMarkers(err));
    if(result.stdout) append('stdout',result.stdout);
    if(err) append(result.ok?'system':'error',err);
    if(result.ok){
      append('success',`Compile OK (${result.durationMs ?? 0} ms)`);
    }else{
      append('error',`Compile failed${result.exitCode!=null?` (exit ${result.exitCode})`:''}${result.timedOut?' [timeout]':''}`);
    }
  }

  async function onRun(){
    setBusy(true);
    append('system',`Running ${mainClass}…`);
    const result=await runJavaProject({
      files,
      mainClass,
      javaHome:javaHome || undefined,
    });
    setBusy(false);
    if(result.jdk) setJdk(result.jdk);
    const compileErr=result.stderr || '';
    setLastStderr(compileErr || result.runStderr || '');
    setMarkers(parseJavacMarkers(compileErr));

    if(result.phase && result.phase!=='run' && !result.ok){
      if(compileErr) append('error',compileErr);
      if(result.error) append('error',result.error);
      append('error',`Failed during ${result.phase}`);
      return;
    }

    if(compileErr && !result.ok && result.phase==='compile'){
      append('error',compileErr);
      append('error','Compile failed — not running');
      return;
    }

    if(result.runStdout) append('stdout',result.runStdout.replace(/\n$/,''));
    if(result.runStderr) append('stderr',result.runStderr.replace(/\n$/,''));

    if(result.stopped){
      append('system','Process stopped.');
      return;
    }
    if(result.timedOut){
      append('error',`Timed out after ${result.runDurationMs ?? 0} ms`);
      return;
    }

    const code=result.runExitCode;
    append(
      result.ok?'success':'error',
      `Process finished with exit code ${code ?? 'null'} (${result.runDurationMs ?? 0} ms)`,
    );
  }

  async function onStop(){
    append('system','Stopping…');
    await stopJavaProcess();
    setBusy(false);
    append('system','Stop signal sent.');
  }

  function onAi(action:AiActionId){
    if(!activeFile) return;
    const next=buildAiSuggestion({
      action,
      file:activeFile,
      files,
      selection,
      compileStderr:lastStderr,
    });
    setSuggestion(next);
    append('system',`AI assist prepared: ${next.title}. Review before applying.`);
  }

  function applySuggestion(){
    if(!suggestion) return;
    const ok=window.confirm('Apply AI-suggested changes to the project files?');
    if(!ok) return;
    setFiles(suggestion.proposedFiles);
    if(!suggestion.proposedFiles.some((f)=>f.path===activePath)){
      setActivePath(suggestion.proposedFiles[0]?.path || activePath);
    }
    setSuggestion(null);
    append('success','AI changes applied.');
  }

  function saveServerSettings(){
    setJavaCompilerBaseUrl(serverUrl);
    window.localStorage.setItem('java-compiler-java-home',javaHome);
    append('system',`Saved server URL ${serverUrl}`);
    void refreshJdk();
  }

  function resetProject(){
    const next=createDefaultProject();
    setFiles(next);
    setActivePath(next[0].path);
    setMainClass('com.example.demo.Main');
    setSuggestion(null);
    clearConsole();
    append('system','Loaded sample project.');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[.14em] text-blue-700 dark:text-blue-400">Java Compiler Tab</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Java Compiler IDE</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monaco editor + local JDK via <code className="rounded bg-slate-100 px-1 dark:bg-slate-900">npm run java-compiler-server</code>
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs dark:border-slate-700">
          <div className="font-semibold text-slate-700 dark:text-slate-200">Active JDK</div>
          <div className={`mt-1 ${jdk?.available?'text-emerald-700 dark:text-emerald-300':'text-rose-700 dark:text-rose-300'}`}>
            {jdk?.available?(jdk.version || 'Detected'):(jdk?.error || 'Not connected')}
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/40 md:grid-cols-3">
        <label className="block">
          <span className="font-semibold text-slate-600 dark:text-slate-300">Compiler server URL</span>
          <input
            value={serverUrl}
            onChange={(e)=>setServerUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <label className="block">
          <span className="font-semibold text-slate-600 dark:text-slate-300">JAVA_HOME (optional)</span>
          <input
            value={javaHome}
            onChange={(e)=>setJavaHome(e.target.value)}
            placeholder="/usr/lib/jvm/java-21-openjdk-amd64"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-950"
          />
        </label>
        <div className="flex items-end gap-2">
          <button type="button" onClick={saveServerSettings} className="rounded-lg bg-slate-900 px-3 py-2 font-semibold text-white dark:bg-blue-700">
            Save & detect
          </button>
          <button type="button" onClick={resetProject} className="rounded-lg border border-slate-300 px-3 py-2 font-semibold dark:border-slate-600">
            Sample project
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <ProjectExplorer
          paths={files.map((f)=>f.path)}
          activePath={activePath}
          onSelect={setActivePath}
          onNewFile={onNewFile}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-mono text-sm font-semibold text-slate-900 dark:text-white">{activePath}</div>
              <div className="text-xs text-slate-500">package {pathToPackageHint(activePath)}</div>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
              Main class
              <select
                value={mainClass}
                onChange={(e)=>setMainClass(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-950"
              >
                {mainClasses.map((c)=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          {activeFile && (
            <div className="h-[420px]">
              <MonacoJavaEditor
                path={activeFile.path}
                value={activeFile.content}
                onChange={updateActiveContent}
                onSelectionChange={setSelection}
                compileMarkers={markers}
                theme={dark?'dark':'light'}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/90 p-2 dark:border-slate-800 dark:bg-slate-900/50">
            <button
              type="button"
              disabled={busy}
              onClick={()=>void onRun()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <Play size={14} fill="currentColor"/>
              Run
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={()=>void onCompile()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-900"
            >
              <Terminal size={14}/>
              Compile
            </button>
            <button
              type="button"
              onClick={()=>void onStop()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900"
            >
              <Square size={13} fill="currentColor"/>
              Stop
            </button>
            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" aria-hidden/>
            <button
              type="button"
              onClick={clearConsole}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-950 dark:hover:text-white"
            >
              <Eraser size={14}/>
              Clear Console
            </button>
            {busy && (
              <span className="ml-auto inline-flex items-center gap-1.5 self-center text-xs font-medium text-slate-500">
                <Loader2 size={12} className="animate-spin"/>
                Running…
              </span>
            )}
          </div>

          <div className="h-[220px]">
            <ConsolePanel lines={lines}/>
          </div>

          <AiAssistPanel
            onAction={onAi}
            suggestion={suggestion}
            onApply={applySuggestion}
            onDismiss={()=>setSuggestion(null)}
            busy={busy}
          />
        </div>
      </div>
    </div>
  );
}
