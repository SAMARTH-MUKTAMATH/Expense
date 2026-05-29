const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function test() {
  try {
    console.log("Testing database connection...");
    const userCount = await db.user.count();
    console.log("Connection successful! User count:", userCount);
  } catch (error) {
    console.error("Database connection failed:", error.message);
  } finally {
    await db.$disconnect();
  }
}

test();
