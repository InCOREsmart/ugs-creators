const assert = require("node:assert/strict");
const { CreatorsController } = require("../dist/creators.controller");

async function main() {
  const calls = [];
  const db = {
    creator: {
      findMany: async (args) => { calls.push(args); return []; },
      count: async (args) => { calls.push({ countWhere: args.where }); return 0; },
    },
  };
  const controller = new CreatorsController(db);
  await controller.list("1", "20", "", { user: { role: "MANAGER", sub: "tenant-user-a" } });
  assert.deepEqual(calls[0].where, {
    assignments: { some: { campaign: { OR: [
      { createdBy: "tenant-user-a" },
      { organization: { members: { some: { userId: "tenant-user-a" } } } },
    ] } } },
  });
  assert.deepEqual(calls[0].select, { id: true, displayName: true, engagementRate: true, createdAt: true });
  for (const field of ["taxStatus", "priceList", "audienceMetrics", "fraudScore"]) {
    assert.equal(field in calls[0].select, false, field + " must not be exposed in directory listing");
  }
  calls.length = 0;
  await controller.list("1", "20", "", { user: { role: "SUPER_ADMIN", sub: "root" } });
  assert.deepEqual(calls[0].where, {});
  console.log("Creator directory privacy checks passed.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
