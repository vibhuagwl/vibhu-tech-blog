import {INVENTORY_CORE, INVENTORY_DISCLAIMER} from './inventory-core';
import {INVENTORY_MODULES} from './inventory-modules';
import {
  ECOSYSTEM_DISCLAIMER,
  ECOSYSTEM_STATS,
  INVENTORY_ECOSYSTEM,
  OWNERSHIP_MATRIX,
} from './inventory-ecosystem';
import type {InventoryEntry, InventoryModuleEntry} from './types';

export {
  INVENTORY_CORE,
  INVENTORY_DISCLAIMER,
  INVENTORY_MODULES,
  INVENTORY_ECOSYSTEM,
  OWNERSHIP_MATRIX,
  ECOSYSTEM_DISCLAIMER,
  ECOSYSTEM_STATS,
};

export const ALL_INVENTORY_ANNOTATIONS: string[] = [
  ...INVENTORY_CORE.map((e) => e.annotation),
  ...INVENTORY_MODULES.map((e) => e.annotation),
  ...INVENTORY_ECOSYSTEM.map((e) => e.annotation),
].sort((a, b) => a.localeCompare(b));

export const INVENTORY_STATS = {
  core: INVENTORY_CORE.length,
  modules: INVENTORY_MODULES.length,
  ecosystem: INVENTORY_ECOSYSTEM.length,
  uniqueNames: new Set(ALL_INVENTORY_ANNOTATIONS).size,
  must: INVENTORY_CORE.filter((e) => e.interviewImportance === 'must').length,
  criticalModules: INVENTORY_MODULES.filter((e) => e.interviewImportance === 'critical').length,
  ownershipRows: OWNERSHIP_MATRIX.length,
} as const;

export type UnifiedInventoryRow = {
  annotation: string;
  category: string;
  module: string;
  processor: string;
  proxy: string;
  importance: string;
  memory: string;
  owner?: string;
  status?: string;
  source: 'core' | 'modules' | 'ecosystem';
};

export function unifyInventory(): UnifiedInventoryRow[] {
  const core: UnifiedInventoryRow[] = INVENTORY_CORE.map((e: InventoryEntry) => ({
    annotation: e.annotation,
    category: e.family,
    module: e.module,
    processor: e.processor,
    proxy: e.proxyRelevant,
    importance: e.interviewImportance,
    memory: e.memory,
    source: 'core' as const,
  }));
  const mods: UnifiedInventoryRow[] = INVENTORY_MODULES.map((e: InventoryModuleEntry) => ({
    annotation: e.annotation,
    category: e.category,
    module: e.module,
    processor: e.processor,
    proxy: e.proxy,
    importance: e.interviewImportance,
    memory: e.memory,
    source: 'modules' as const,
  }));
  const eco: UnifiedInventoryRow[] = INVENTORY_ECOSYSTEM.map((e) => ({
    annotation: e.annotation,
    category: e.category,
    module: e.module,
    processor: e.processor,
    proxy: e.proxy,
    importance: e.interviewImportance,
    memory: e.purpose.slice(0, 120),
    owner: e.owner,
    status: e.status,
    source: 'ecosystem' as const,
  }));
  return [...core, ...mods, ...eco].sort((a, b) => a.annotation.localeCompare(b.annotation));
}

export const SCOPE_NOTE =
  'Target: all important Spring/Spring Boot ecosystem annotations for enterprise production + Staff interviews (Framework 6 / Boot 3). Explicitly NOT every annotation ever shipped across Spring Cloud Netflix history. Deprecated/legacy APIs are marked (e.g. Stream @EnableBinding). Jakarta/JPA/Hibernate ownership is separated from Spring.';
