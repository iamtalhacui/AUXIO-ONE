// Plan → module entitlement lives in the shared database package so the API
// and the seed backfill can never disagree.
//
// Imported via the "database/plan-modules" subpath rather than the package
// barrel: the barrel re-exports @prisma/client (CommonJS), and Node's
// require(esm) interop drops sibling named exports in that case, which this
// CommonJS build would see as undefined at runtime.
export {
  CORE_MODULES,
  OPTIONAL_MODULES,
  PLAN_MODULES,
  getEntitledModuleCodes,
  isCoreModule,
  isOptionalModule,
  resolveEntitledModuleCodes,
} from 'database/plan-modules';
