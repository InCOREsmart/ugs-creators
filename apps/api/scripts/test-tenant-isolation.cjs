const assert = require("node:assert/strict");
const { CampaignsController } = require("../dist/campaigns.controller");

async function main() {
  const listCalls = [];
  const db = {
    campaign: {
      findMany: async (args) => { listCalls.push(args); return []; },
      count: async () => 0,
      findUnique: async () => ({ id: "campaign-a", organizationId: "org-a", createdBy: "owner-a" }),
    },
    organizationMember: { findUnique: async () => null },
    creator: { findUnique: async () => ({ id: "creator-a" }) },
    creatorAssignment: { upsert: async () => { throw new Error("upsert must not run for cross-tenant request"); } },
  };
  const controller = new CampaignsController(db);

  await controller.list("1", "20", { user: { role: "MANAGER", sub: "user-a" } });
  await controller.list("1", "20", { user: { role: "MANAGER", sub: "user-b" } });
  assert.deepEqual(listCalls[0].where, {
    OR: [
      { createdBy: "user-a" },
      { organization: { members: { some: { userId: "user-a" } } } },
    ],
  });
  assert.deepEqual(listCalls[1].where, {
    OR: [
      { createdBy: "user-b" },
      { organization: { members: { some: { userId: "user-b" } } } },
    ],
  });
  assert.notDeepEqual(listCalls[0].where, listCalls[1].where, "organization scopes must be user-specific");

  await controller.list("1", "20", { user: { role: "CREATOR", sub: "creator-user-a" } });
  assert.deepEqual(listCalls[2].where, {
    creatorAssignments: { some: { creator: { userId: "creator-user-a" } } },
  });

  await assert.rejects(
    controller.assignCreator("campaign-a", { creatorId: "00000000-0000-4000-8000-000000000001" }, {
      user: { role: "MANAGER", sub: "user-from-org-b" },
    }),
    (error) => error && typeof error.getStatus === "function" && error.getStatus() === 403,
    "a manager from another organization must not assign creators to this campaign",
  );

  console.log("Tenant isolation regression checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
