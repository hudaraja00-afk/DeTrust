import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const [, , arg] = process.argv;

try {
  if (!arg || arg === "--list") {
    const files = await prisma.secureFile.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    console.table(
      files.map((file) => ({
        id: file.id,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: file.createdAt,
      })),
    );
  } else {
    const file = await prisma.secureFile.findUnique({ where: { id: arg } });
    console.log(file);
  }
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
