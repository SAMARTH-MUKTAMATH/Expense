const { PrismaClient } = require("@prisma/client");

const url = "postgresql://postgres.idztqgafhttrsnrfulpz:y72SitBWKfBihjKn@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

try {
  const db1 = new PrismaClient({ url: url });
  console.log("url property worked");
} catch(e) { console.error("url error:", e.message) }

try {
  const db2 = new PrismaClient({ datasourceUrl: url });
  console.log("datasourceUrl property worked");
} catch(e) { console.error("datasourceUrl error:", e.message) }

try {
  const db3 = new PrismaClient({ adapter: null, url: url });
  console.log("adapter property worked");
} catch(e) { console.error("adapter block error:", e.message) }
