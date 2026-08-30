import fs from 'node:fs';
import path from 'node:path';
import type {DemoSourceFile, DemoTreeNode} from '@/lib/oauth-demo-source';
import {buildOAuthDemoTree} from '@/lib/oauth-demo-source';

export type {DemoSourceFile, DemoTreeNode};

const DEMO_ROOT = path.join(process.cwd(), 'flash-sale-system');

const INCLUDE_EXT = new Set([
  '.java',
  '.xml',
  '.yml',
  '.yaml',
  '.sql',
  '.md',
  '.sh',
  '.json',
  '.properties',
  '.js',
  '.lua',
]);

const SKIP_DIR = new Set(['target', '.git', 'node_modules', '.idea']);

function languageFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.java':
      return 'java';
    case '.xml':
      return 'xml';
    case '.yml':
    case '.yaml':
      return 'yaml';
    case '.sql':
      return 'sql';
    case '.md':
      return 'markdown';
    case '.sh':
      return 'bash';
    case '.json':
      return 'json';
    case '.properties':
      return 'properties';
    case '.js':
      return 'javascript';
    case '.lua':
      return 'lua';
    default:
      return 'text';
  }
}

function walk(dir: string, base = DEMO_ROOT): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    if (SKIP_DIR.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (
      INCLUDE_EXT.has(path.extname(entry.name).toLowerCase()) ||
      entry.name === 'Dockerfile' ||
      entry.name === 'docker-compose.yml'
    ) {
      out.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return out;
}

export function listFlashSaleFiles(): DemoSourceFile[] {
  if (!fs.existsSync(DEMO_ROOT)) return [];
  return walk(DEMO_ROOT)
    .sort((a, b) => a.localeCompare(b))
    .map((rel) => {
      const abs = path.join(DEMO_ROOT, rel);
      const content = fs.readFileSync(abs, 'utf8');
      return {
        path: rel,
        name: path.basename(rel),
        language: languageFor(rel),
        content,
        lines: content.length === 0 ? 0 : content.split(/\r?\n/).length,
      };
    });
}

export function buildFlashSaleTree(files: DemoSourceFile[]): DemoTreeNode[] {
  return buildOAuthDemoTree(files);
}

export const FLASH_SALE_CODE_JUMPS = [
  {
    label: 'Purchase API',
    path: 'flash-sale-service/src/main/java/com/example/flashsale/flash/application/service/SubmitPurchaseService.java',
  },
  {
    label: 'Redis Lua gate',
    path: 'flash-sale-service/src/main/resources/redis/inventory-gate.lua',
  },
  {
    label: 'Redis Java',
    path: 'flash-sale-service/src/main/java/com/example/flashsale/flash/infrastructure/redis/InventoryRedisService.java',
  },
  {
    label: 'Resilience4j payment',
    path: 'payment-service/src/main/java/com/example/flashsale/payment/infrastructure/resilience/ResilientPaymentClient.java',
  },
  {
    label: 'Atomic inventory',
    path: 'inventory-service/src/main/java/com/example/flashsale/inventory/application/ReserveInventoryService.java',
  },
  {
    label: 'CAS SQL',
    path: 'inventory-service/src/main/java/com/example/flashsale/inventory/domain/repository/InventoryRepository.java',
  },
  {
    label: 'Order saga',
    path: 'order-service/src/main/java/com/example/flashsale/order/application/saga/SagaOrchestrator.java',
  },
  {
    label: 'Payment + CB',
    path: 'payment-service/src/main/java/com/example/flashsale/payment/application/ProcessPaymentService.java',
  },
  {
    label: 'API Gateway',
    path: 'api-gateway/src/main/java/com/example/flashsale/gateway/GatewayApplication.java',
  },
] as const;
