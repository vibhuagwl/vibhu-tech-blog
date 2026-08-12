export type JavaIdeFile={
  path:string;
  content:string;
};

export type JdkInfo={
  available:boolean;
  javaHome:string|null;
  javaPath:string;
  javacPath:string;
  version:string|null;
  javacVersion:string|null;
  error:string|null;
};

export type CompileRunResult={
  ok:boolean;
  phase?:string;
  jdk?:JdkInfo;
  stdout?:string;
  stderr?:string;
  exitCode?:number|null;
  durationMs?:number;
  mainClass?:string;
  runStdout?:string;
  runStderr?:string;
  runExitCode?:number|null;
  runDurationMs?:number;
  timedOut?:boolean;
  stopped?:boolean;
  error?:string;
};

const DEFAULT_BASE=
  (typeof process!=='undefined' && process.env.NEXT_PUBLIC_JAVA_COMPILER_URL)
  || 'http://127.0.0.1:3927';

export function getJavaCompilerBaseUrl(){
  if(typeof window!=='undefined'){
    const saved=window.localStorage.getItem('java-compiler-server-url');
    if(saved) return saved.replace(/\/$/,'');
  }
  return DEFAULT_BASE.replace(/\/$/,'');
}

export function setJavaCompilerBaseUrl(url:string){
  if(typeof window!=='undefined'){
    window.localStorage.setItem('java-compiler-server-url',url.replace(/\/$/,''));
  }
}

async function post<T>(pathName:string,body:unknown):Promise<T>{
  const res=await fetch(`${getJavaCompilerBaseUrl()}${pathName}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body),
  });
  return res.json() as Promise<T>;
}

export async function fetchJdkStatus(javaHome?:string):Promise<{ok:boolean;jdk:JdkInfo;error?:string}>{
  const qs=javaHome?`?javaHome=${encodeURIComponent(javaHome)}`:'';
  try{
    const res=await fetch(`${getJavaCompilerBaseUrl()}/jdk${qs}`,{cache:'no-store'});
    return res.json();
  }catch{
    return {
      ok:false,
      jdk:{
        available:false,
        javaHome:javaHome || null,
        javaPath:'java',
        javacPath:'javac',
        version:null,
        javacVersion:null,
        error:'Compiler server unreachable. Run: npm run java-compiler-server',
      },
      error:'Compiler server unreachable',
    };
  }
}

export async function compileJavaProject(input:{
  files:JavaIdeFile[];
  javaHome?:string;
  timeoutMs?:number;
}):Promise<CompileRunResult>{
  try{
    return await post<CompileRunResult>('/compile',input);
  }catch(err){
    return {ok:false,phase:'network',error:String(err),stderr:'Compiler server unreachable. Run: npm run java-compiler-server'};
  }
}

export async function runJavaProject(input:{
  files:JavaIdeFile[];
  mainClass?:string;
  javaHome?:string;
  timeoutMs?:number;
  args?:string[];
  stdin?:string;
}):Promise<CompileRunResult>{
  try{
    return await post<CompileRunResult>('/run',input);
  }catch(err){
    return {ok:false,phase:'network',error:String(err),runStderr:'Compiler server unreachable. Run: npm run java-compiler-server'};
  }
}

export async function stopJavaProcess():Promise<{ok:boolean;stopped?:string[]}>{
  try{
    return await post('/stop',{});
  }catch{
    return {ok:false};
  }
}
