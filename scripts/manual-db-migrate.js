/*
 Manual DB migration: add subject/body to campaign_steps and enforce NOT NULL.
 Usage:
   DB_URL=postgresql://user:pass@host:port/db node scripts/manual-db-migrate.js
*/

const { Client } = require("pg");

async function run() {
  const connectionString = process.env.DB_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Missing DB_URL or DATABASE_URL env var");
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const statements = [
    `ALTER TABLE "campaign_steps" ADD COLUMN IF NOT EXISTS "subject" TEXT;`,
    `ALTER TABLE "campaign_steps" ADD COLUMN IF NOT EXISTS "body" TEXT;`,
    `UPDATE "campaign_steps" SET "subject" = COALESCE("subject", name) WHERE "subject" IS NULL;`,
    `UPDATE "campaign_steps" SET "body" = COALESCE("body", '') WHERE "body" IS NULL;`,
    `ALTER TABLE "campaign_steps" ALTER COLUMN "subject" SET NOT NULL;`,
    `ALTER TABLE "campaign_steps" ALTER COLUMN "body" SET NOT NULL;`,
    // Connected email accounts: add MSAL cache columns for Outlook silent refresh
    `ALTER TABLE "connected_email_accounts" ADD COLUMN IF NOT EXISTS "msalCache" TEXT;`,
    `ALTER TABLE "connected_email_accounts" ADD COLUMN IF NOT EXISTS "msalHomeAccountId" TEXT;`,
    // Message inbox sync columns
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'CAMPAIGN';`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "provider" TEXT;`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "externalId" TEXT;`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "threadKey" TEXT;`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "accountId" TEXT;`,
    `ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "receivedAt" TIMESTAMP;`,
    // Unique composite on (provider, externalId)
    `DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'messages_provider_externalid_key'
      ) THEN
        ALTER TABLE "messages" ADD CONSTRAINT messages_provider_externalid_key UNIQUE ("provider","externalId");
      END IF;
    END $$;`,
    // AccountSyncState table
    `CREATE TABLE IF NOT EXISTS "account_sync_states" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "userId" TEXT NOT NULL,
      "accountId" TEXT UNIQUE NOT NULL,
      provider TEXT NOT NULL,
      "isFullSyncEnabled" BOOLEAN NOT NULL DEFAULT FALSE,
      "excludedDomains" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
      "lastGmailHistoryId" TEXT,
      "lastSyncedAt" TIMESTAMP
    );`,
    // Backfill default source for existing messages
    `UPDATE "messages" SET "source"='CAMPAIGN' WHERE "source" IS NULL;`,
  ];

  try {
    await client.connect();
    console.log("Connected to database");
    for (const sql of statements) {
      console.log("Running:", sql);
      await client.query(sql);
    }
    console.log("✅ Migration complete");
  } catch (err) {
    console.error("Migration error:", err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
