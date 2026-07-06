import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doctors = await prisma.doctor.findMany();
  const appointments = await prisma.appointment.findMany({
    include: { user: true, doctor: true }
  });
  const users = await prisma.user.findMany();
  
  console.log("DOCTORS IN DB:", doctors.map(d => ({ id: d.id, name: d.name, email: d.email })));
  console.log("USERS IN DB:", users.map(u => ({ id: u.id, name: u.name, email: u.email })));
  console.log("APPOINTMENTS IN DB:", appointments.map(a => ({ id: a.id, date: a.date, patientName: a.patientName, doctorId: a.doctorId, doctorName: a.doctor.name })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
