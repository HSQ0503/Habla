import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("password123", 12);

  // Create teacher (admin)
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@test.com" },
    update: { password: hashedPassword, isAdmin: true },
    create: {
      email: "teacher@test.com",
      password: hashedPassword,
      name: "Ms. Rodriguez",
      role: "TEACHER",
      isAdmin: true,
    },
  });

  // Create class
  const spanishClass = await prisma.class.upsert({
    where: { code: "ESP301" },
    update: {},
    create: {
      name: "IB Spanish SL Period 3",
      code: "ESP301",
      teacherId: teacher.id,
    },
  });

  // Create students
  await prisma.user.upsert({
    where: { email: "student1@test.com" },
    update: { password: hashedPassword },
    create: {
      email: "student1@test.com",
      password: hashedPassword,
      name: "Alex Chen",
      role: "STUDENT",
      classId: spanishClass.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "student2@test.com" },
    update: { password: hashedPassword },
    create: {
      email: "student2@test.com",
      password: hashedPassword,
      name: "Maria Santos",
      role: "STUDENT",
      classId: spanishClass.id,
    },
  });

  // Create sample images (global, pre-approved)
  await prisma.image.createMany({
    skipDuplicates: true,
    data: [
      {
        url: "https://placeholder.com/images/identities-01.jpg",
        theme: "IDENTITIES",
        culturalContext:
          "A mural in Mexico City depicting traditional Día de los Muertos celebrations, showing families gathering at cemeteries with ofrendas, marigold flowers, and sugar skulls.",
        talkingPoints: [
          "How do cultural celebrations shape personal and community identity?",
          "What role do traditions play in connecting generations?",
          "How does public art reflect cultural values?",
          "Compare this celebration with how your culture honors the deceased.",
        ],
        scope: "GLOBAL",
        approvalStatus: "APPROVED",
        creatorId: teacher.id,
        approvedBy: teacher.id,
        approvedAt: new Date(),
      },
      {
        url: "https://placeholder.com/images/experiences-01.jpg",
        theme: "EXPERIENCES",
        culturalContext:
          "A photograph of young backpackers at a bustling mercado in Guatemala, interacting with local vendors selling handmade textiles and fresh produce.",
        talkingPoints: [
          "How does travel change our perspective on daily life?",
          "What can we learn from market culture in different countries?",
          "Describe a memorable experience involving food or shopping in another culture.",
        ],
        scope: "GLOBAL",
        approvalStatus: "APPROVED",
        creatorId: teacher.id,
        approvedBy: teacher.id,
        approvedAt: new Date(),
      },
      {
        url: "https://placeholder.com/images/human-ingenuity-01.jpg",
        theme: "HUMAN_INGENUITY",
        culturalContext:
          "An aerial view of the Inca citadel Machu Picchu in Peru, showcasing the advanced engineering of terraced agriculture and stone construction without mortar.",
        talkingPoints: [
          "What does this site reveal about Inca engineering and problem-solving?",
          "How do ancient innovations compare with modern technology?",
          "Why is preserving historical sites important for future generations?",
          "How does geography influence architectural innovation?",
        ],
        scope: "GLOBAL",
        approvalStatus: "APPROVED",
        creatorId: teacher.id,
        approvedBy: teacher.id,
        approvedAt: new Date(),
      },
    ],
  });

  console.log("Seed data created successfully");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
