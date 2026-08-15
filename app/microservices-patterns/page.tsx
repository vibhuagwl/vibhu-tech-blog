import type {Metadata} from 'next';
import {Suspense} from 'react';
import MicroservicesPatternsHub from '@/components/microservices-patterns/microservices-patterns-hub';
import {buildSpringMspLabTree, listSpringMspLabFiles} from '@/lib/spring-msp-lab-source';
import {buildSpringMspPlatformTree, listSpringMspPlatformFiles} from '@/lib/spring-msp-platform-source';

export const metadata: Metadata = {
  title: 'Microservices Design Patterns — End-to-End Implementation Master',
  description:
    '154 patterns end-to-end: Java 21 + Spring + Kafka/Redis/Postgres artifacts, Testcontainers/WireMock labs, multi-service Docker Compose checkout platform, 500 interview prompts.',
};

export default function MicroservicesPatternsPage() {
  const files = listSpringMspLabFiles();
  const tree = buildSpringMspLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('MspLabApplication.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  const platformFiles = listSpringMspPlatformFiles();
  const platformTree = buildSpringMspPlatformTree(platformFiles);
  const platformDefaultPath =
    platformFiles.find((f) => f.path === 'README.md')?.path
    ?? platformFiles.find((f) => f.path.includes('docker-compose.yml'))?.path
    ?? platformFiles.find((f) => f.path.includes('OrderController.java'))?.path
    ?? platformFiles[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading microservices patterns…</div>}>
        <MicroservicesPatternsHub
          files={files}
          tree={tree}
          defaultPath={defaultPath}
          platformFiles={platformFiles}
          platformTree={platformTree}
          platformDefaultPath={platformDefaultPath}
        />
      </Suspense>
    </main>
  );
}
