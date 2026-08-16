/** Unified production corner-case matrix (50 scenarios). */

export type CornerDeep = {
  id: string;
  failure: string;
  side: 'Producer' | 'Consumer' | 'DLT' | 'Replay' | 'Batch' | 'Txn' | 'DR';
  retry: string;
  dlt: string;
  commit: string;
  seek: string;
  ordering: string;
  dup: string;
  loss: string;
  replay: string;
};

export const CORNER_MATRIX: CornerDeep[] = [
  {id:'01', failure:'Producer serialization fail', side:'Producer', retry:'No', dlt:'N/A', commit:'N/A', seek:'N/A', ordering:'N/A', dup:'No', loss:'Never ingested', replay:'Fix producer'},
  {id:'02', failure:'Broker down on produce', side:'Producer', retry:'Client yes', dlt:'N/A', commit:'N/A', seek:'N/A', ordering:'N/A', dup:'Idempotent PID', loss:'If give up w/o outbox', replay:'Outbox relay'},
  {id:'03', failure:'Produce timeout unknown', side:'Producer', retry:'Careful', dlt:'N/A', commit:'N/A', seek:'N/A', ordering:'N/A', dup:'Possible', loss:'Unknown', replay:'Reconcile'},
  {id:'04', failure:'ACL WRITE denied produce', side:'Producer', retry:'No', dlt:'N/A', commit:'N/A', seek:'N/A', ordering:'N/A', dup:'No', loss:'Until ACL', replay:'Ops'},
  {id:'05', failure:'RecordTooLarge produce', side:'Producer', retry:'No', dlt:'N/A', commit:'N/A', seek:'N/A', ordering:'N/A', dup:'No', loss:'Rejected', replay:'Shrink'},
  {id:'06', failure:'DB timeout in listener', side:'Consumer', retry:'Yes bounded', dlt:'After cap', commit:'After success/DLT', seek:'On fail', ordering:'Blocked if in-thread', dup:'If redelivery', loss:'Low if correct', replay:'After recover'},
  {id:'07', failure:'DB deadlock 40P01', side:'Consumer', retry:'Yes', dlt:'Eventually', commit:'After OK', seek:'Yes', ordering:'Same', dup:'Possible', loss:'Low', replay:'N/A'},
  {id:'08', failure:'Pool exhaustion', side:'Consumer', retry:'Yes/pause', dlt:'If exhausted', commit:'No while failing', seek:'Yes', ordering:'Risk rebalance', dup:'Yes', loss:'Low', replay:'N/A'},
  {id:'09', failure:'HTTP 503 downstream', side:'Consumer', retry:'Yes + CB', dlt:'After cap', commit:'After', seek:'Yes', ordering:'Retry topics better', dup:'Yes', loss:'Low', replay:'When healthy'},
  {id:'10', failure:'HTTP 400 validation', side:'Consumer', retry:'No', dlt:'Now', commit:'After DLT', seek:'If DLT fail', ordering:'Skip', dup:'DLT dup risk', loss:'If commit-first', replay:'Fix payload'},
  {id:'11', failure:'HTTP 401/403', side:'Consumer', retry:'Limited', dlt:'If permanent', commit:'After', seek:'Yes', ordering:'—', dup:'—', loss:'—', replay:'Fix auth'},
  {id:'12', failure:'HTTP 429', side:'Consumer', retry:'Yes jitter', dlt:'After cap', commit:'After', seek:'Yes', ordering:'Prefer hops', dup:'—', loss:'—', replay:'—'},
  {id:'13', failure:'Circuit OPEN', side:'Consumer', retry:'Pause/shed', dlt:'Optional', commit:'No thrash', seek:'Pause', ordering:'—', dup:'—', loss:'—', replay:'After close'},
  {id:'14', failure:'JSON parse poison', side:'Consumer', retry:'No', dlt:'Immediate', commit:'After DLT', seek:'If fail', ordering:'Skip', dup:'DLT', loss:'If mis-ack', replay:'After fix'},
  {id:'15', failure:'Avro unknown schema id', side:'Consumer', retry:'Maybe SR', dlt:'If incompat', commit:'After', seek:'Yes', ordering:'—', dup:'—', loss:'—', replay:'Register/fix'},
  {id:'16', failure:'SR unavailable', side:'Consumer', retry:'Yes', dlt:'Avoid storm', commit:'No', seek:'Yes', ordering:'Stall ok', dup:'—', loss:'If force commit', replay:'N/A'},
  {id:'17', failure:'Deser before listener', side:'Consumer', retry:'Via EHD', dlt:'Raw bytes', commit:'After DLT', seek:'Yes', ordering:'—', dup:'—', loss:'Without EHD', replay:'Raw'},
  {id:'18', failure:'Null key unexpected', side:'Consumer', retry:'No', dlt:'Yes', commit:'After', seek:'—', ordering:'Hot partition risk', dup:'—', loss:'—', replay:'Add key'},
  {id:'19', failure:'Application NPE', side:'Consumer', retry:'No (poison)', dlt:'Yes', commit:'After', seek:'—', ordering:'Skip', dup:'—', loss:'—', replay:'Code fix'},
  {id:'20', failure:'OutOfMemoryError', side:'Consumer', retry:'No (Error)', dlt:'No EH', commit:'No', seek:'Crash', ordering:'Rebalance', dup:'Yes', loss:'Possible', replay:'Ops'},
  {id:'21', failure:'Process crash mid-handler', side:'Consumer', retry:'Redeliver', dlt:'No yet', commit:'No', seek:'Restart', ordering:'—', dup:'Yes', loss:'Low', replay:'Idempotent'},
  {id:'22', failure:'DLT publish ACL deny', side:'DLT', retry:'Source retries', dlt:'Fail', commit:'NO', seek:'YES', ordering:'Stall', dup:'Later', loss:'If commit anyway', replay:'Fix ACL'},
  {id:'23', failure:'DLT topic missing', side:'DLT', retry:'Source', dlt:'Fail', commit:'NO', seek:'YES', ordering:'Stall', dup:'—', loss:'If commit', replay:'Create topic'},
  {id:'24', failure:'DLT RecordTooLarge', side:'DLT', retry:'Source', dlt:'Fail', commit:'NO', seek:'YES', ordering:'Stall', dup:'—', loss:'—', replay:'Truncate/headers-only'},
  {id:'25', failure:'DLT broker timeout', side:'DLT', retry:'Source', dlt:'Fail', commit:'NO', seek:'YES', ordering:'Stall', dup:'Dup DLT later', loss:'—', replay:'—'},
  {id:'26', failure:'Crash after DLT before commit', side:'DLT', retry:'Redeliver', dlt:'Dup possible', commit:'Pending', seek:'—', ordering:'—', dup:'HIGH DLT', loss:'No', replay:'Dedupe DLT'},
  {id:'27', failure:'Commit before DLT', side:'DLT', retry:'N/A', dlt:'Maybe never', commit:'Done', seek:'No', ordering:'—', dup:'No', loss:'HIGH', replay:'From backup only'},
  {id:'28', failure:'Txn rollback then ARP DLT', side:'Txn', retry:'ARP', dlt:'In/after txn cfg', commit:'commitRecovered', seek:'ARP', ordering:'—', dup:'Fence risk', loss:'If misconfig', replay:'—'},
  {id:'29', failure:'Producer fenced in txn', side:'Txn', retry:'No blind', dlt:'Careful', commit:'Abort', seek:'—', ordering:'—', dup:'—', loss:'—', replay:'New epoch'},
  {id:'30', failure:'Rebalance mid-process', side:'Consumer', retry:'Other owner', dlt:'Race', commit:'Race', seek:'Revoke', ordering:'—', dup:'HIGH', loss:'Low', replay:'Idempotent'},
  {id:'31', failure:'Rebalance mid-DLT publish', side:'DLT', retry:'—', dlt:'Maybe dup', commit:'Race', seek:'—', ordering:'—', dup:'HIGH', loss:'Possible odd', replay:'Dedupe'},
  {id:'32', failure:'max.poll.interval exceeded', side:'Consumer', retry:'—', dlt:'—', commit:'—', seek:'Kick', ordering:'Storm', dup:'Yes', loss:'—', replay:'Shorten work'},
  {id:'33', failure:'Batch fail at C', side:'Batch', retry:'C', dlt:'C after cap', commit:'A,B then…', seek:'From C', ordering:'Partial', dup:'D,E', loss:'If wrong idx', replay:'—'},
  {id:'34', failure:'Batch without BLFE', side:'Batch', retry:'Whole', dlt:'Ambiguous', commit:'Careful', seek:'Whole', ordering:'—', dup:'HIGH', loss:'—', replay:'—'},
  {id:'35', failure:'@RetryableTopic on batch', side:'Batch', retry:'Unsupported', dlt:'Use DEH', commit:'—', seek:'—', ordering:'—', dup:'—', loss:'—', replay:'N/A'},
  {id:'36', failure:'DB OK offset fail', side:'Consumer', retry:'Redeliver', dlt:'No', commit:'Fail', seek:'—', ordering:'—', dup:'HIGH biz', loss:'No', replay:'Inbox UNIQUE'},
  {id:'37', failure:'Offset OK DB fail', side:'Consumer', retry:'Lost unless outbox', dlt:'Maybe', commit:'Done', seek:'No', ordering:'—', dup:'No', loss:'Biz write', replay:'Outbox/CDC'},
  {id:'38', failure:'Duplicate Kafka delivery', side:'Consumer', retry:'N/A', dlt:'No', commit:'Yes', seek:'—', ordering:'—', dup:'Handled', loss:'No', replay:'Inbox'},
  {id:'39', failure:'Replay without cap', side:'Replay', retry:'Loop', dlt:'Refill', commit:'—', seek:'—', ordering:'—', dup:'Storm', loss:'—', replay:'replayCount'},
  {id:'40', failure:'Replay changes key', side:'Replay', retry:'—', dlt:'—', commit:'—', seek:'—', ordering:'BREAK', dup:'—', loss:'—', replay:'Keep key'},
  {id:'41', failure:'Blind full DLT replay', side:'Replay', retry:'—', dlt:'—', commit:'—', seek:'—', ordering:'Chaos', dup:'HIGH', loss:'—', replay:'Filter+audit'},
  {id:'42', failure:'Payment timeout unknown', side:'Consumer', retry:'Reconcile first', dlt:'If stuck', commit:'After state', seek:'—', ordering:'—', dup:'Double charge risk', loss:'—', replay:'Inquire bank'},
  {id:'43', failure:'Bank accept crash before ack', side:'Consumer', retry:'Redeliver', dlt:'—', commit:'No', seek:'—', ordering:'—', dup:'Charge risk', loss:'—', replay:'Idempotency-Key'},
  {id:'44', failure:'OOO Shipped before Paid', side:'Consumer', retry:'Park', dlt:'Not skip Paid', commit:'Hold', seek:'—', ordering:'CRITICAL', dup:'—', loss:'Biz corrupt if skip', replay:'Replay Paid first'},
  {id:'45', failure:'Shared global DLT multi-svc', side:'DLT', retry:'—', dlt:'Noisy', commit:'—', seek:'—', ordering:'—', dup:'—', loss:'Ownership', replay:'Wrong team'},
  {id:'46', failure:'MM2 DLT offset assume equal', side:'DR', retry:'—', dlt:'—', commit:'Wrong', seek:'—', ordering:'—', dup:'Yes', loss:'Yes', replay:'Recompute'},
  {id:'47', failure:'Active-active dual consume', side:'DR', retry:'—', dlt:'Both', commit:'—', seek:'—', ordering:'—', dup:'HIGH', loss:'—', replay:'Global idem'},
  {id:'48', failure:'Compaction on DLT topic', side:'DLT', retry:'—', dlt:'Data loss', commit:'—', seek:'—', ordering:'—', dup:'—', loss:'HIGH', replay:'Use delete policy'},
  {id:'49', failure:'PII in DLT + wide ACL', side:'DLT', retry:'—', dlt:'Leak', commit:'—', seek:'—', ordering:'—', dup:'—', loss:'Privacy', replay:'RBAC+mask'},
  {id:'50', failure:'Infinite FixedBackOff UNLIMITED', side:'Consumer', retry:'Forever', dlt:'Never', commit:'No', seek:'Hot', ordering:'Stall', dup:'—', loss:'Availability', replay:'Cap+classifier'},
];

export const MATRIX_HEADERS = [
  '#',
  'Failure',
  'Side',
  'Retry',
  'DLT',
  'Commit',
  'Seek',
  'Ordering',
  'Dup',
  'Loss',
  'Replay',
];
