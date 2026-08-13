import type {Metadata} from 'next';
import {Suspense} from 'react';
import CamundaHub from '@/components/camunda/camunda-hub';
import {buildSpringCamundaLabTree, listSpringCamundaLabFiles} from '@/lib/spring-camunda-lab-source';

export const metadata: Metadata = {
  title: 'Camunda 8 BPMN Payment Platform — Interview and Production Hub',
  description:
    'Complete Camunda 8 guide for payment orchestration: Zeebe, BPMN, Spring workers, REST APIs, retries, incidents, saga, user tasks, timers, messages, Kubernetes, and interviews.',
};

export default function CamundaPage() {
  const files = listSpringCamundaLabFiles();
  const tree = buildSpringCamundaLabTree(files);
  const defaultPath =
    files.find((f) => f.path.includes('payment-process.bpmn'))?.path
    ?? files.find((f) => f.path.includes('PaymentController.java'))?.path
    ?? files.find((f) => f.path === 'README.md')?.path
    ?? files[0]?.path
    ?? '';

  return (
    <main>
      <Suspense fallback={<div className="px-5 py-10 text-sm text-slate-500">Loading Camunda guide...</div>}>
        <CamundaHub files={files} tree={tree} defaultPath={defaultPath} />
      </Suspense>
    </main>
  );
}
