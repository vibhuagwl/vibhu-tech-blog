import type {FailureRow} from './types';

export const FAILURE_MATRIX: FailureRow[] = [
  {failure: 'Validation / business rule (400)', retry: 'No — classifier permanent', dlt: 'Immediate DLT', commit: 'After DLT publish', dup: 'Low unless replay', loss: 'Low if DLT ok', alert: 'Business rejection rate'},
  {failure: 'Schema / unknown enum / bad JSON', retry: 'No — poison', dlt: 'Immediate DLT', commit: 'After DLT to unblock', dup: 'Replay after fix', loss: 'High if skip without DLT', alert: 'Poison spike'},
  {failure: 'DB timeout / transient SQL', retry: 'Yes — capped (3–10)', dlt: 'After cap', commit: 'After success or DLT', dup: 'Yes — idempotent sink', loss: 'Low', alert: 'DB latency + retry rate'},
  {failure: 'DB unavailable / pool exhausted', retry: 'Short cap then DLT or pause', dlt: 'After cap or circuit open', commit: 'Policy: pause vs DLT flood', dup: 'Yes', loss: 'Medium if DLT full', alert: 'Pool + connection errors'},
  {failure: 'API 503 / timeout', retry: 'Yes — retry topic preferred', dlt: 'After cap', commit: 'After success/DLT', dup: 'Yes', loss: 'Low', alert: 'Dependency SLO'},
  {failure: 'API 400 from downstream', retry: 'No', dlt: 'Immediate', commit: 'After DLT', dup: 'Replay if payload fix', loss: 'Low', alert: 'Contract mismatch'},
  {failure: 'AuthN / AuthZ failure', retry: 'No until creds fixed', dlt: 'Optional quarantine', commit: 'Do not infinite retry', dup: 'N/A', loss: 'Messages pile in lag', alert: 'Auth error rate Sev1'},
  {failure: 'Serialization (producer)', retry: 'No', dlt: 'N/A — fails at produce', commit: 'N/A', dup: 'No', loss: 'Record never ingested', alert: 'Producer error'},
  {failure: 'Deserialization (consumer pre-listener)', retry: 'No — ErrorHandlingDeserializer', dlt: 'DLT via recoverer', commit: 'After DLT', dup: 'Replay after schema fix', loss: 'Skip without DLT', alert: 'Deser failures'},
  {failure: 'DLT publish failure', retry: 'Seek + backoff resets (default)', dlt: 'Stuck — same record', commit: 'Not advanced', dup: 'Later success may dup', loss: 'DLT entry missing until ok', alert: 'Recoverer failure Sev1'},
  {failure: 'Broker / leader unavailable', retry: 'Client retries fetch/produce', dlt: 'Deferred until broker up', commit: 'Held', dup: 'Transient redelivery', loss: 'Low', alert: 'URP / offline partitions'},
  {failure: 'Consumer crash mid-process', retry: 'Redelivery on restart', dlt: 'If was retrying — may dup attempt', commit: 'Uncommitted → redeliver', dup: 'Yes at-least-once', loss: 'If committed early', alert: 'Pod restart rate'},
  {failure: 'Rebalance revoke mid-process', retry: 'New owner may redeliver', dlt: 'commitSync on revoke critical', commit: 'Revoke handler', dup: 'Yes', loss: 'If ack before process', alert: 'Rebalance storm'},
  {failure: 'max.poll.interval exceeded', retry: 'Member removed → redelivery', dlt: 'In-thread retry caused stall', commit: 'Generation change', dup: 'Yes', loss: 'Low', alert: 'Poll interval violations'},
  {failure: 'Transactional commit failure', retry: 'Abort + AfterRollbackProcessor', dlt: 'commitRecovered path', commit: 'Txn boundary', dup: 'Controlled by idempotency', loss: 'Uncommitted aborted', alert: 'Txn abort rate'},
  {failure: 'ProducerFencedException', retry: 'No — stop container', dlt: 'May not run ARP', commit: 'Txn invalid', dup: 'Fence prevents zombie', loss: 'Until restart', alert: 'FENCED consumer stopped'},
  {failure: 'Offset commit after DLT fail', retry: 'IllegalGeneration if stale', dlt: 'Duplicate DLT risk on retry', commit: 'Retry commit', dup: 'Possible', loss: 'Low', alert: 'Commit errors'},
  {failure: 'Hot poison key', retry: 'Blocks partition loop', dlt: 'Immediate poison path', commit: 'After DLT', dup: 'N/A', loss: 'Other keys on partition delayed', alert: 'Single partition lag'},
  {failure: 'Ordering gap (event 2 fail, 3 ok)', retry: 'Park 3 — do not apply', dlt: 'Event 2 to DLT; 3 to parking', commit: 'Careful — state machine', dup: 'Replay 2 then drain park', loss: 'State corruption if skip', alert: 'Out-of-order metric'},
  {failure: 'Replay without idempotency', retry: 'N/A', dlt: 'May leave DLT', commit: 'After duplicate process', dup: 'YES — double payment', loss: 'Low', alert: 'replay.failed'},
  {failure: 'Record too large', retry: 'No', dlt: 'Skip or side-store pointer', commit: 'Policy', dup: 'No', loss: 'Record never processed', alert: 'RecordTooLarge'},
  {failure: 'ACL deny on DLT WRITE', retry: 'Recoverer throws', dlt: 'Fails', commit: 'Stall', dup: 'Later', loss: 'Until ACL fixed', alert: 'Authorization failed'},
];

export const CORNER_CASES: {
  id: string;
  title: string;
  sequence: string;
  processed: string;
  dltPublished: string;
  offsetCommitted: string;
  dupRisk: string;
  lossRisk: string;
  recovery: string;
}[] = [
  {id: 'c01', title: 'Process OK, commit fails', sequence: 'Process→DB commit→commitSync throws', processed: 'Yes', dltPublished: 'No', offsetCommitted: 'No', dupRisk: 'High on redelivery', lossRisk: 'Low with idempotency', recovery: 'Redeliver; UNIQUE key ignores dup'},
  {id: 'c02', title: 'Commit OK, process never ran', sequence: 'Bug: ack before handler', processed: 'No', dltPublished: 'No', offsetCommitted: 'Yes', dupRisk: 'No', lossRisk: 'HIGH — silent skip', recovery: 'Fix ack order; manual replay from mirror'},
  {id: 'c03', title: 'DLT publish OK, offset not committed', sequence: 'Recoverer success→crash before ack', processed: 'No', dltPublished: 'Yes', offsetCommitted: 'No', dupRisk: 'Redelivery + second DLT', lossRisk: 'Low', recovery: 'Idempotent DLT or dedupe by offset header'},
  {id: 'c04', title: 'DLT publish fails', sequence: 'Recoverer throws→seek', processed: 'No', dltPublished: 'No', offsetCommitted: 'No', dupRisk: 'After fix', lossRisk: 'Medium until DLT ok', recovery: 'Fix broker/ACL; partition retries'},
  {id: 'c05', title: 'Poison JSON first byte', sequence: 'Deser fail→DLT', processed: 'No', dltPublished: 'Yes', offsetCommitted: 'Yes', dupRisk: 'On replay', lossRisk: 'Low', recovery: 'Fix payload; replay'},
  {id: 'c06', title: '10 retries then DLT', sequence: 'Default FixedBackOff(0,9)', processed: 'No', dltPublished: 'Yes after 10th', offsetCommitted: 'After DLT', dupRisk: 'Medium', lossRisk: 'Low', recovery: 'Tune classifier to fail faster'},
  {id: 'c07', title: '@RetryableTopic stage 2', sequence: 'Main→retry-0→retry-1 fail→DLT', processed: 'No', dltPublished: 'Yes from DLT handler', offsetCommitted: 'Main advanced on forward', dupRisk: 'Retry topics may dup', lossRisk: 'Low', recovery: 'Drain DLT'},
  {id: 'c08', title: 'Transactional rollback', sequence: 'Listener throws→no offset', processed: 'No', dltPublished: 'Via ARP if configured', offsetCommitted: 'No', dupRisk: 'Redelivery', lossRisk: 'Low', recovery: 'AfterRollbackProcessor path'},
  {id: 'c09', title: 'commitRecovered txn DLT', sequence: 'ARP+commitRecovered publishes DLT in new txn', processed: 'No', dltPublished: 'Yes', offsetCommitted: 'Yes in new txn', dupRisk: 'Lower', lossRisk: 'Low', recovery: 'Preferred txn DLT path'},
  {id: 'c10', title: 'Rebalance during DEH sleep', sequence: 'Sleep in backoff→revoke', processed: 'Maybe partial', dltPublished: 'Maybe', offsetCommitted: 'Revoke commitSync', dupRisk: 'High', lossRisk: 'Medium', recovery: 'Short backoff; cooperative assignor'},
  {id: 'c11', title: 'Static member restart', sequence: 'Crash→same instance id', processed: 'Redeliver uncommitted', dltPublished: 'As per policy', offsetCommitted: 'If was committed', dupRisk: 'Yes', lossRisk: 'Low', recovery: 'Idempotency'},
  {id: 'c12', title: 'Duplicate event_id redelivery', sequence: 'Same offset redelivered', processed: 'Ignored DUPLICATE', dltPublished: 'No', offsetCommitted: 'Yes after ignore', dupRisk: 'None', lossRisk: 'Low', recovery: 'UNIQUE constraint'},
  {id: 'c13', title: 'Replay same DLT twice', sequence: 'Ops double-clicks replay', processed: 'Second ignored if idempotent', dltPublished: 'No', offsetCommitted: 'Yes', dupRisk: 'Without lock HIGH', lossRisk: 'Low', recovery: 'Optimistic replay lock'},
  {id: 'c14', title: 'Replay after SETTLED', sequence: 'Illegal transition', processed: 'Rejected', dltPublished: 'Stays in DLT', offsetCommitted: 'N/A', dupRisk: 'No', lossRisk: 'Low', recovery: 'Mark IGNORED'},
  {id: 'c15', title: 'Event 2 DLT, event 3 parked', sequence: 'OOO lifecycle', processed: '3 parked not settled', dltPublished: '2 yes', offsetCommitted: '2 yes; 3 not committed past park', dupRisk: 'On replay 2', lossRisk: 'State safe', recovery: 'Replay 2 then drain 3'},
  {id: 'c16', title: 'DLT fewer partitions', sequence: 'Same-partition resolver', processed: 'No', dltPublished: 'FAIL', offsetCommitted: 'No', dupRisk: 'Later', lossRisk: 'Partition stall', recovery: 'partition -1 or match counts'},
  {id: 'c17', title: 'Null key retry', sequence: 'Key null→random partition on retry', processed: 'Unordered', dltPublished: 'Maybe', offsetCommitted: 'Varies', dupRisk: 'High', lossRisk: 'Order loss', recovery: 'Always set business key'},
  {id: 'c18', title: 'Batch listener failure index 3', sequence: 'BatchListenerFailedException(3)', processed: '0-2 maybe committed', dltPublished: 'Record 3+ to DLT', offsetCommitted: 'Partial batch policy', dupRisk: '0-2 dup possible', lossRisk: 'Medium', recovery: 'Idempotent each index'},
  {id: 'c19', title: 'resetStateOnRecoveryFailure false', sequence: 'DLT fail→immediate re-recover', processed: 'No', dltPublished: 'Retry recover quickly', offsetCommitted: 'When ok', dupRisk: 'Medium', lossRisk: 'Low', recovery: 'Understand backoff reset'},
  {id: 'c20', title: 'EOS consume-produce not DB', sequence: 'Kafka txn ok, DB fails', processed: 'No', dltPublished: 'Maybe', offsetCommitted: 'Txn aborted', dupRisk: 'Kafka side controlled', lossRisk: 'DB gap', recovery: 'Idempotent DB + outbox'},
  {id: 'c21', title: 'read_committed aborted txn', sequence: 'Aborted produce invisible', processed: 'N/A', dltPublished: 'N/A', offsetCommitted: 'N/A', dupRisk: 'No', lossRisk: 'Aborted work lost by design', recovery: 'Retry produce path'},
  {id: 'c22', title: 'Circuit breaker open', sequence: 'Stop retry→DLT flood', processed: 'No', dltPublished: 'Paused or sampled', offsetCommitted: 'Pause consumption', dupRisk: 'When resume', lossRisk: 'Lag grows', recovery: 'Pause + alert dependency'},
  {id: 'c23', title: 'Stack trace header huge', sequence: 'DLT headers exceed max', processed: 'No', dltPublished: 'FAIL size', offsetCommitted: 'No', dupRisk: 'Later', lossRisk: 'Stall', recovery: 'Truncate stack in recoverer'},
  {id: 'c24', title: 'Cross-region DLT replicate', sequence: 'DLT mirrored to DR', processed: 'N/A', dltPublished: 'Yes in DR', offsetCommitted: 'Source region', dupRisk: 'Replay from DR dup', lossRisk: 'Low', recovery: 'Replay idempotency global'},
];

export const CHAOS: string[][] = [
  ['Kill consumer during DEH retry sleep', 'Partition may rebalance; redelivery; dup if processed before crash'],
  ['Kill broker holding DLT leader', 'Recoverer fails; seek loop until metadata refresh'],
  ['Revoke partition during listener', 'commitSync on revoke; another member may dup'],
  ['Fill DLT disk quota', 'Produce fails; recoverer throws; source partition stalls'],
  ['Inject poison message 1%', 'DLT rate spikes; lag on healthy keys if per-partition poison'],
  ['Downstream API 503 for 10m', 'Retry topic lag grows; then DLT if cap low'],
  ['Expire Kafka ACL on DLT WRITE', 'AuthorizationException in recoverer; stall'],
  ['Duplicate transactional.id pod', 'ProducerFencedException; container may stop'],
  ['max.poll.interval during 30s backoff', 'Member kicked; rebalance dup'],
  ['Replay storm from ops', 'Main topic lag; idempotency must hold'],
  ['Schema registry down', 'Deser failures → DLT if ErrorHandlingDeserializer'],
  ['Network partition to DB only', 'Retry then DLT; consumer healthy'],
];

export const TROUBLESHOOT: {title: string; symptoms: string; causes: string; fix: string}[] = [
  {title: 'Partition lag stuck — one partition', symptoms: 'Single partition lag flat high', causes: 'Poison or recoverer failure on that partition', fix: 'Inspect offset; check DLT publish errors; fast-path poison to DLT'},
  {title: 'DLT rate spike', symptoms: 'dlt.publish.rate ↑', causes: 'Bad deploy, schema change, upstream bug', fix: 'Compare exception FQCN headers; rollback deploy'},
  {title: 'Recoverer failure loop', symptoms: 'Same offset forever; recoverer errors in logs', causes: 'ACL, record too large, disk full', fix: 'Fix broker; truncate headers; grant WRITE'},
  {title: 'Retry storm no DLT', symptoms: 'High CPU; retry rate ↑; DLT flat', causes: 'Classifier marks permanent as retryable', fix: 'Add notRetryableExceptions; lower cap'},
  {title: 'Duplicates after deploy', symptoms: 'Idempotency hits ↑', causes: 'Rebalance during processing', fix: 'Static membership; cooperative; idempotent sink'},
  {title: 'DLT lag growing', symptoms: 'DLT consumer lag ↑', causes: 'No replay tooling; ops backlog', fix: 'Scale replay; automate triage'},
  {title: 'Missing messages in DLT', symptoms: 'Gap in offset vs processed count', causes: 'Committed without DLT on skip bug', fix: 'Audit ack order; never skip without DLT'},
  {title: 'Transactional consumer stuck', symptoms: 'Txn abort loop', causes: 'Listener always throws; ARP seeks', fix: 'Fix root cause or route to DLT via ARP'},
  {title: 'Batch partial failure confusion', symptoms: 'Dup subset of batch', causes: 'Wrong BatchListenerFailedException index', fix: 'Idempotent per record; test batch DEH'},
  {title: 'Ordering broken after replay', symptoms: 'State corruption', causes: 'Replay changed key or partition', fix: 'Same key republish to source topic'},
  {title: 'max.poll.interval during backoff', symptoms: 'Frequent rebalance', causes: 'Long in-thread FixedBackOff', fix: 'Switch to @RetryableTopic'},
  {title: 'DLT partition mismatch exception', symptoms: 'Unknown partition or produce fail', causes: 'DLT fewer partitions than source', fix: 'Increase DLT partitions or resolver -1'},
];
