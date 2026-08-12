#!/usr/bin/env node
/**
 * Local Java Compiler IDE backend.
 * Compiles/runs user Java with the host JDK in an isolated temp workspace.
 * Used by /java-compiler (static Next.js site cannot invoke javac itself).
 *
 *   npm run java-compiler-server
 *   JAVA_HOME=/path/to/jdk npm run java-compiler-server
 */
import http from 'node:http';
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';

const PORT=Number(process.env.JAVA_COMPILER_PORT || 3927);
const HOST=process.env.JAVA_COMPILER_HOST || '127.0.0.1';
const MAX_FILES=40;
const MAX_FILE_BYTES=200_000;
const DEFAULT_COMPILE_TIMEOUT_MS=20_000;
const DEFAULT_RUN_TIMEOUT_MS=15_000;
const WORK_ROOT=path.join(os.tmpdir(),'vibhu-java-compiler-ide');

/** @type {Map<string,{child:import('node:child_process').ChildProcess, killed:boolean}>} */
const running=new Map();

function json(res,status,body){
  const payload=JSON.stringify(body);
  res.writeHead(status,{
    'Content-Type':'application/json; charset=utf-8',
    'Content-Length':Buffer.byteLength(payload),
    'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Cache-Control':'no-store',
  });
  res.end(payload);
}

function readBody(req){
  return new Promise((resolve,reject)=>{
    const chunks=[];
    let size=0;
    req.on('data',(c)=>{
      size+=c.length;
      if(size>2_000_000){
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end',()=>{
      try{
        const raw=Buffer.concat(chunks).toString('utf8');
        resolve(raw?JSON.parse(raw):{});
      }catch(err){
        reject(err);
      }
    });
    req.on('error',reject);
  });
}

function resolveJavaHome(configured){
  const fromConfig=configured && String(configured).trim();
  if(fromConfig && fs.existsSync(fromConfig)) return fromConfig;
  if(process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) return process.env.JAVA_HOME;
  return '';
}

function javaBin(javaHome,name){
  if(javaHome){
    const candidate=path.join(javaHome,'bin',process.platform==='win32'?`${name}.exe`:name);
    if(fs.existsSync(candidate)) return candidate;
  }
  return name;
}

function runCmd(cmd,args,opts={}){
  const {
    cwd,
    timeoutMs=DEFAULT_COMPILE_TIMEOUT_MS,
    env={},
    input,
    sessionId,
  }=opts;

  return new Promise((resolve)=>{
    const started=Date.now();
    const child=spawn(cmd,args,{
      cwd,
      env,
      stdio:['pipe','pipe','pipe'],
      windowsHide:true,
    });

    if(sessionId){
      running.set(sessionId,{child,killed:false});
    }

    let stdout='';
    let stderr='';
    let settled=false;

    const finish=(result)=>{
      if(settled) return;
      settled=true;
      if(sessionId) running.delete(sessionId);
      resolve({
        ...result,
        durationMs:Date.now()-started,
      });
    };

    const timer=setTimeout(()=>{
      try{child.kill('SIGKILL');}catch{/* ignore */}
      finish({
        ok:false,
        timedOut:true,
        exitCode:null,
        stdout,
        stderr:stderr+`\n[timeout] Process exceeded ${timeoutMs}ms and was killed.\n`,
      });
    },timeoutMs);

    child.stdout.on('data',(d)=>{stdout+=d.toString('utf8');});
    child.stderr.on('data',(d)=>{stderr+=d.toString('utf8');});
    child.on('error',(err)=>{
      clearTimeout(timer);
      finish({
        ok:false,
        timedOut:false,
        exitCode:null,
        stdout,
        stderr:stderr+`\n${err.message}\n`,
        spawnError:true,
      });
    });
    child.on('close',(code,signal)=>{
      clearTimeout(timer);
      const entry=sessionId?running.get(sessionId):null;
      finish({
        ok:code===0 && !entry?.killed,
        timedOut:false,
        exitCode:code,
        signal,
        stdout,
        stderr,
        stopped:Boolean(entry?.killed),
      });
    });

    if(input!=null){
      child.stdin.write(String(input));
    }
    child.stdin.end();
  });
}

async function detectJdk(configuredJavaHome){
  const javaHome=resolveJavaHome(configuredJavaHome);
  const javaPath=javaBin(javaHome,'java');
  const javacPath=javaBin(javaHome,'javac');

  const version=await runCmd(javaPath,['-version'],{
    timeoutMs:8_000,
    env:sanitizedEnv(javaHome),
  });
  const compiler=await runCmd(javacPath,['-version'],{
    timeoutMs:8_000,
    env:sanitizedEnv(javaHome),
  });

  const versionText=`${version.stderr || ''}${version.stdout || ''}`.trim();
  const compilerText=`${compiler.stderr || ''}${compiler.stdout || ''}`.trim();
  const available=version.ok && compiler.ok;

  return {
    available,
    javaHome:javaHome || null,
    javaPath,
    javacPath,
    version:versionText || null,
    javacVersion:compilerText || null,
    error:available?null:(
      version.spawnError || compiler.spawnError
        ? 'JDK not found. Install a JDK or set JAVA_HOME / configure the path in the IDE.'
        : (version.stderr || compiler.stderr || 'Unable to detect JDK')
    ),
  };
}

function sanitizedEnv(javaHome){
  const pathParts=[];
  if(javaHome) pathParts.push(path.join(javaHome,'bin'));
  // Keep a minimal PATH so java/javac resolve, but drop cloud credentials.
  const systemPath=process.env.PATH || process.env.Path || '';
  pathParts.push(systemPath);

  return {
    PATH:pathParts.join(path.delimiter),
    JAVA_HOME:javaHome || '',
    LANG:process.env.LANG || 'C.UTF-8',
    HOME:os.homedir(),
    TMPDIR:os.tmpdir(),
    // Explicitly omit AWS_*, GITHUB_*, OPENAI_*, CURSOR_*, tokens, etc.
  };
}

function assertSafeRelPath(rel){
  const normalized=rel.replace(/\\/g,'/').replace(/^\/+/,'');
  if(!normalized || normalized.includes('..') || path.isAbsolute(normalized)){
    throw new Error(`Unsafe path: ${rel}`);
  }
  if(!normalized.endsWith('.java')){
    throw new Error(`Only .java files allowed: ${rel}`);
  }
  return normalized;
}

function prepareWorkspace(files){
  if(!Array.isArray(files) || files.length===0){
    throw new Error('At least one Java file is required');
  }
  if(files.length>MAX_FILES){
    throw new Error(`Too many files (max ${MAX_FILES})`);
  }

  fs.mkdirSync(WORK_ROOT,{recursive:true});
  const sessionId=randomUUID();
  const root=path.join(WORK_ROOT,sessionId);
  const srcRoot=path.join(root,'src');
  const outRoot=path.join(root,'out');
  fs.mkdirSync(srcRoot,{recursive:true});
  fs.mkdirSync(outRoot,{recursive:true});

  const written=[];
  for(const file of files){
    const rel=assertSafeRelPath(file.path || file.name);
    const content=String(file.content ?? '');
    if(Buffer.byteLength(content,'utf8')>MAX_FILE_BYTES){
      throw new Error(`File too large: ${rel}`);
    }
    const abs=path.join(srcRoot,rel);
    fs.mkdirSync(path.dirname(abs),{recursive:true});
    fs.writeFileSync(abs,content,'utf8');
    written.push(abs);
  }

  return {sessionId,root,srcRoot,outRoot,written};
}

function cleanup(root){
  try{fs.rmSync(root,{recursive:true,force:true});}catch{/* ignore */}
}

function inferMainClass(files,requested){
  if(requested && String(requested).trim()) return String(requested).trim();
  for(const file of files){
    const content=String(file.content ?? '');
    if(!/public\s+static\s+void\s+main\s*\(/.test(content)) continue;
    const pkg=content.match(/^\s*package\s+([\w.]+)\s*;/m);
    const cls=content.match(/public\s+class\s+(\w+)/);
    if(cls){
      return pkg?`${pkg[1]}.${cls[1]}`:cls[1];
    }
  }
  throw new Error('No main class found. Add public static void main, or select a main class.');
}

async function compileProject({files,javaHome,timeoutMs}){
  const jdk=await detectJdk(javaHome);
  if(!jdk.available){
    return {ok:false,phase:'jdk',jdk,stdout:'',stderr:jdk.error || 'JDK unavailable',exitCode:null,durationMs:0};
  }

  let workspace;
  try{
    workspace=prepareWorkspace(files);
  }catch(err){
    return {ok:false,phase:'project',jdk,stdout:'',stderr:String(err.message || err),exitCode:null,durationMs:0};
  }

  const args=['-encoding','UTF-8','-d',workspace.outRoot,...workspace.written];
  const result=await runCmd(jdk.javacPath,args,{
    cwd:workspace.root,
    timeoutMs:timeoutMs || DEFAULT_COMPILE_TIMEOUT_MS,
    env:sanitizedEnv(jdk.javaHome || undefined),
    sessionId:`compile-${workspace.sessionId}`,
  });

  return {
    ok:result.ok,
    phase:'compile',
    jdk,
    workspace,
    stdout:result.stdout,
    stderr:result.stderr,
    exitCode:result.exitCode,
    durationMs:result.durationMs,
    timedOut:result.timedOut,
    stopped:result.stopped,
  };
}

function publicResult(result){
  const {workspace, ...rest}=result;
  return rest;
}

async function runProject(body){
  const compile=await compileProject(body);
  if(!compile.ok){
    if(compile.workspace) cleanup(compile.workspace.root);
    return {
      ...compile,
      phase:compile.phase || 'compile',
      runStdout:'',
      runStderr:'',
      runExitCode:null,
      runDurationMs:0,
    };
  }

  let mainClass;
  try{
    mainClass=inferMainClass(body.files,body.mainClass);
  }catch(err){
    cleanup(compile.workspace.root);
    return {
      ok:false,
      phase:'main-class',
      jdk:compile.jdk,
      stdout:compile.stdout,
      stderr:String(err.message || err),
      exitCode:null,
      durationMs:compile.durationMs,
      runStdout:'',
      runStderr:String(err.message || err),
      runExitCode:null,
      runDurationMs:0,
    };
  }

  const runSession=`run-${compile.workspace.sessionId}`;
  const run=await runCmd(compile.jdk.javaPath,['-cp',compile.workspace.outRoot,mainClass,...(body.args || [])],{
    cwd:compile.workspace.root,
    timeoutMs:body.timeoutMs || DEFAULT_RUN_TIMEOUT_MS,
    env:sanitizedEnv(compile.jdk.javaHome || undefined),
    input:body.stdin,
    sessionId:runSession,
  });

  cleanup(compile.workspace.root);

  return {
    ok:run.ok,
    phase:'run',
    jdk:compile.jdk,
    mainClass,
    stdout:compile.stdout,
    stderr:compile.stderr,
    exitCode:compile.exitCode,
    durationMs:compile.durationMs,
    runStdout:run.stdout,
    runStderr:run.stderr,
    runExitCode:run.exitCode,
    runDurationMs:run.durationMs,
    timedOut:run.timedOut,
    stopped:run.stopped,
    signal:run.signal,
  };
}

function stopAll(){
  const stopped=[];
  for(const [id,entry] of running.entries()){
    entry.killed=true;
    try{entry.child.kill('SIGKILL');}catch{/* ignore */}
    stopped.push(id);
  }
  return stopped;
}

const server=http.createServer(async (req,res)=>{
  if(req.method==='OPTIONS'){
    res.writeHead(204,{
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods':'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
    });
    res.end();
    return;
  }

  const url=new URL(req.url || '/',`http://${HOST}:${PORT}`);

  try{
    if(req.method==='GET' && (url.pathname==='/' || url.pathname==='/health')){
      const jdk=await detectJdk(url.searchParams.get('javaHome') || undefined);
      json(res,200,{ok:true,service:'java-compiler-ide',port:PORT,jdk});
      return;
    }

    if(req.method==='GET' && url.pathname==='/jdk'){
      const jdk=await detectJdk(url.searchParams.get('javaHome') || undefined);
      json(res,jdk.available?200:503,{ok:jdk.available,jdk});
      return;
    }

    if(req.method==='POST' && url.pathname==='/compile'){
      const body=await readBody(req);
      const result=await compileProject(body);
      if(result.workspace) cleanup(result.workspace.root);
      json(res,result.ok?200:400,publicResult(result));
      return;
    }

    if(req.method==='POST' && url.pathname==='/run'){
      const body=await readBody(req);
      const result=await runProject(body);
      json(res,result.ok?200:400,publicResult(result));
      return;
    }

    if(req.method==='POST' && url.pathname==='/stop'){
      const stopped=stopAll();
      json(res,200,{ok:true,stopped});
      return;
    }

    json(res,404,{ok:false,error:'Not found'});
  }catch(err){
    json(res,500,{ok:false,error:String(err.message || err)});
  }
});

server.listen(PORT,HOST,()=>{
  console.log(`[java-compiler-server] listening on http://${HOST}:${PORT}`);
  detectJdk().then((jdk)=>{
    if(jdk.available){
      console.log(`[java-compiler-server] JDK OK: ${jdk.version}`);
      if(jdk.javaHome) console.log(`[java-compiler-server] JAVA_HOME=${jdk.javaHome}`);
    }else{
      console.warn(`[java-compiler-server] JDK missing: ${jdk.error}`);
    }
  });
});
