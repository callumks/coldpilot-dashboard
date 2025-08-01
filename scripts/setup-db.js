const { PrismaClient } = require("@prisma/client");

async function setupDatabase() {
  const prisma = new PrismaClient();

  try {
    console.log("🔄 Setting up database...");

    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected");

    // Try to count users (will fail if tables don't exist)
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ Database already set up! Found ${userCount} users.`);
    } catch (error) {
      console.log("❌ Tables not found. Please run: npx prisma db push");
      console.log("Or use Railway web console to create tables.");
    }
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
