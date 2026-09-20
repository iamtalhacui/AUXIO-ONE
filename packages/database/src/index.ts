export { PrismaClient } from "@prisma/client";
export * from "@prisma/client";

// Plan entitlements are intentionally NOT re-exported here. The `export *`
// above pulls in a CommonJS module, and Node's require(esm) interop drops
// sibling named exports in that combination — CommonJS consumers would
// silently receive `undefined`. Import them from "database/plan-modules".
