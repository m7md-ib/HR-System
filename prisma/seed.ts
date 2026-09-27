import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  await db.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  const management = await db.department.upsert({
    where: { id: "seed-dept-management" },
    update: {},
    create: { id: "seed-dept-management", name: "Management", nameAr: "الإدارة" },
  });

  const hrPosition = await db.position.upsert({
    where: { id: "seed-pos-hr-officer" },
    update: {},
    create: { id: "seed-pos-hr-officer", title: "HR Officer", titleAr: "موظف موارد بشرية", departmentId: management.id },
  });
  void hrPosition;

  const users: { email: string; name: string; role: Parameters<typeof db.user.create>[0]["data"]["role"]; password: string }[] = [
    { email: "admin@mayshr.com", name: "System Admin", role: "ADMIN", password: "Admin@12345" },
    { email: "hr.manager@mayshr.com", name: "Sara Al-Khatib", role: "HR_MANAGER", password: "Hr@123456" },
    { email: "hr.officer@mayshr.com", name: "Lina Odeh", role: "HR_EMPLOYEE", password: "Hr@123456" },
    { email: "accountant@mayshr.com", name: "Omar Nasser", role: "ACCOUNTANT", password: "Acc@123456" },
    { email: "manager@mayshr.com", name: "Khaled Amer", role: "MANAGER", password: "Mgr@123456" },
  ];

  for (const u of users) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: await hash(u.password),
      },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
