#!/usr/bin/env node
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const PORT=3937;
const BASE=`http://127.0.0.1:${PORT}`;

function assert(cond,msg){
  if(!cond) throw new Error(msg);
}

async function waitHealth(timeoutMs=8000){
  const start=Date.now();
  while(Date.now()-start<timeoutMs){
    try{
      const res=await fetch(`${BASE}/health`);
      if(res.ok) return res.json();
    }catch{/* retry */}
    await new Promise((r)=>setTimeout(r,150));
  }
  throw new Error('Server did not become healthy');
}

async function main(){
  const child=spawn(process.execPath,[path.join(__dirname,'java-compiler-server.mjs')],{
    env:{...process.env,JAVA_COMPILER_PORT:String(PORT),JAVA_COMPILER_HOST:'127.0.0.1'},
    stdio:['ignore','pipe','pipe'],
  });

  let failed=false;
  try{
    const health=await waitHealth();
    assert(health.ok,'health.ok');
    assert(health.jdk?.available,'JDK should be available in CI/dev image');

    const hello={
      files:[{
        path:'com/example/demo/Main.java',
        content:`package com.example.demo;
public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java Compiler IDE!");
  }
}
`,
      }],
      mainClass:'com.example.demo.Main',
    };

    const compileOk=await fetch(`${BASE}/compile`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(hello),
    }).then((r)=>r.json());
    assert(compileOk.ok,'compile should succeed');

    const runOk=await fetch(`${BASE}/run`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(hello),
    }).then((r)=>r.json());
    assert(runOk.ok,'run should succeed');
    assert(String(runOk.runStdout).includes('Hello from Java Compiler IDE!'),'stdout missing greeting');
    assert(runOk.runExitCode===0,'exit code 0');

    const bad={
      files:[{
        path:'Broken.java',
        content:'public class Broken { public static void main(String[] a) { System.out.println("x" } }',
      }],
    };
    const compileBad=await fetch(`${BASE}/compile`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(bad),
    }).then((r)=>r.json());
    assert(!compileBad.ok,'compile should fail for syntax error');
    assert(String(compileBad.stderr).length>0,'stderr should contain javac diagnostics');

    const boom={
      files:[{
        path:'Boom.java',
        content:`public class Boom {
  public static void main(String[] args) {
    throw new RuntimeException("boom");
  }
}
`,
      }],
      mainClass:'Boom',
    };
    const runBoom=await fetch(`${BASE}/run`,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(boom),
    }).then((r)=>r.json());
    assert(!runBoom.ok,'runtime failure expected');
    assert(String(runBoom.runStderr).includes('RuntimeException'),'runtime stderr missing');

    const stop=await fetch(`${BASE}/stop`,{method:'POST'}).then((r)=>r.json());
    assert(stop.ok,'stop endpoint');

    console.log('java-compiler-server tests passed');
  }catch(err){
    failed=true;
    console.error('java-compiler-server tests FAILED:',err);
  }finally{
    child.kill('SIGKILL');
  }
  process.exit(failed?1:0);
}

main();
