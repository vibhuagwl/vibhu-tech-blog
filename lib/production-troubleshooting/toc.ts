import type {TocItem} from './types';

export const PROD_TOC: TocItem[] = [
  {id: 'overview', label: 'Payment Latency Incident'},
  {id: 'golden-rule', label: 'Golden Rule'},
  {id: 'severity', label: 'Severity P1–P4'},
  {id: 'first5', label: 'First 5 Minutes'},
  {id: 'signals', label: 'Golden Signals'},
  {id: 'frontend', label: 'Angular · React · CDN'},
  {id: 'edge', label: 'Gateway · ALB'},
  {id: 'spring', label: 'Spring · Threads · JVM'},
  {id: 'cascade', label: 'Cascade · Retry Storm'},
  {id: 'data', label: 'DB · Redis · Kafka'},
  {id: 'aws', label: 'AWS · K8s · Network'},
  {id: 'deploy', label: 'Deploy · Rollback'},
  {id: 'observe', label: 'Logs · Traces · RCA'},
  {id: 'playbook', label: 'P1 Playbook · Escalate'},
  {id: 'scenarios', label: '50 Scenarios'},
  {id: 'architecture', label: 'Master Decision Tree'},
  {id: 'decision', label: 'Symptom → Check'},
  {id: 'commands', label: 'Command Toolbox'},
  {id: 'interview', label: 'Interview Mode'},
  {id: 'cheat', label: 'Cheat Sheet'},
];
