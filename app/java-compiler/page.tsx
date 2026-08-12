import type {Metadata} from 'next';
import JavaIde from '@/components/java-compiler/java-ide';

export const metadata:Metadata={
  title:'Java Compiler IDE',
  description:'In-browser Java IDE with Monaco editor, local JDK compile/run server, project explorer, console, and Cursor/AI assist with review-before-apply.',
};

export default function JavaCompilerPage(){
  return (
    <main className="mx-auto max-w-[1400px] px-5 py-8">
      <JavaIde/>
    </main>
  );
}
