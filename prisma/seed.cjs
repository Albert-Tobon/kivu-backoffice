// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.APP_LOGIN_EMAIL;

  if (!email) {
    throw new Error(
      "APP_LOGIN_EMAIL debe estar definido en .env para el seed"
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Admin KIVU",
      role: "ADMIN",
    },
    create: {
      name: "Admin KIVU",
      email,
      role: "ADMIN",
    },
  });

  console.log("Usuario admin listo:", user.email);
}

main()
  .catch((e) => {
    console.error("Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
