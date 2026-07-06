import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { medicines: true, cancerType: true }
  });
  
  users.forEach(u => {
    console.log(`PATIENT: ${u.name} (ID: ${u.id})`);
    console.log(`CANCER:`, u.cancerType.map(c => c.name));
    console.log(`MEDICINES:`, u.medicines.map(m => ({ name: m.medName, dose: m.dose, start: m.startDate, end: m.endDate })));
    console.log("------------------------");
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
