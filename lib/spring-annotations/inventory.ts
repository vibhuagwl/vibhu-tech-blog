import {INVENTORY_CORE, INVENTORY_DISCLAIMER} from './inventory-core';
import {INVENTORY_MODULES} from './inventory-modules';
import type {InventoryEntry, InventoryModuleEntry} from './types';

export {INVENTORY_CORE, INVENTORY_DISCLAIMER, INVENTORY_MODULES};

export const ALL_INVENTORY_ANNOTATIONS: string[] = [
  ...INVENTORY_CORE.map((e) => e.annotation),
  ...INVENTORY_MODULES.map((e) => e.annotation),
].sort((a, b) => a.localeCompare(b));

export const INVENTORY_STATS = {
  core: INVENTORY_CORE.length,
  modules: INVENTORY_MODULES.length,
  uniqueNames: new Set(ALL_INVENTORY_ANNOTATIONS).size,
  must: INVENTORY_CORE.filter((e) => e.interviewImportance === 'must').length,
  criticalModules: INVENTORY_MODULES.filter((e) => e.interviewImportance === 'critical').length,
} as const;

export const INVENTORY_CATEGORIES: string[] = [
  ...new Set([
    ...INVENTORY_CORE.map((e) => e.family),
    ...INVENTORY_MODULES.map((e) => e.category),
  ]),
].sort();

export type UnifiedInventoryRow = {
  annotation: string;
  category: string;
  module: string;
  processor: string;
  proxy: string;
  importance: string;
  memory: string;
  source: 'core' | 'modules';
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
  return [...core, ...mods].sort((a, b) => a.annotation.localeCompare(b.annotation));
}

export const SCOPE_NOTE =
  'Target: all important Spring/Spring Boot ecosystem annotations used in enterprise production apps — with processors and interview depth. Not a claim of every annotation ever published across Spring Cloud Netflix history.';
