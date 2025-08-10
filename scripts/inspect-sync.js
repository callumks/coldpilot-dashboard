/*
 Inspect sync state in DB. Usage:
   DB_URL=postgresql://... node scripts/inspect-sync.js
*/
const { Client } = require("pg");

async function run() {
  const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DB_URL");
    process.exit(1);
  }
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const q = async (label, sql) => {
    const { rows } = await client.query(sql);
    console.log(`\n=== ${label} ===`);
    console.log(rows);
    return rows;
  };

  try {
    await q(
      "Connected accounts",
      `select id,email,provider,"isActive" from connected_email_accounts order by "updatedAt" desc limit 10`
    );
    await q(
      "Account sync states",
      `select "accountId",provider,"isFullSyncEnabled","excludedDomains","lastSyncedAt" from account_sync_states`
    );
    await q(
      "Messages count by provider",
      `select coalesce(provider,'UNKNOWN') as provider,count(*) from messages group by provider order by 2 desc`
    );
    await q(
      "Recent messages",
      `select id,provider,source,externalId,substring(threadKey for 16) as threadKey,accountId,conversationId,substring(content for 40) as snippet,sentAt from messages order by sentAt desc limit 20`
    );
    await q(
      "Recent conversations",
      `select id,subject,userId,contactId,lastMessageAt from conversations order by lastMessageAt desc limit 10`
    );
    await q(
      "Contacts sample",
      `select id,name,email from contacts order by createdAt desc limit 10`
    );
  } finally {
    await client.end();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
