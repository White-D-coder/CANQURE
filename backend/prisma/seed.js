import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding new schema...');

  // 1. Clean Database
  console.log('Cleaning old records...');
  await prisma.report.deleteMany().catch(() => {});
  await prisma.refillOrder.deleteMany().catch(() => {});
  await prisma.medicine.deleteMany().catch(() => {});
  await prisma.cancerType.deleteMany().catch(() => {});
  await prisma.appointment.deleteMany().catch(() => {});
  await prisma.timeSlot.deleteMany().catch(() => {});
  await prisma.sosAlert.deleteMany().catch(() => {});
  await prisma.admin.deleteMany().catch(() => {});
  await prisma.doctor.deleteMany().catch(() => {});
  await prisma.hospital.deleteMany().catch(() => {});
  await prisma.pharmacy.deleteMany().catch(() => {});
  await prisma.user.deleteMany().catch(() => {});

  // 2. Seed Hospitals
  console.log('Seeding hospitals...');
  const medanta = await prisma.hospital.create({
    data: {
      name: 'Medanta Cancer Institute',
      address: 'Medanta - The Medicity, Sector 38, Gurugram',
      city: 'Gurugram',
      contact: '+91 124 414 1414',
      email: 'info@medanta.org',
      bedsAvailable: 25,
      facilities: ['Chemotherapy', 'Surgical Oncology', 'ICU', 'Ambulance Service'],
      latitude: 28.4312,
      longitude: 77.0423
    }
  });

  const fortis = await prisma.hospital.create({
    data: {
      name: 'Fortis Memorial Research Institute',
      address: 'Sector 44, opposite HUDA City Centre, Gurugram',
      city: 'Gurugram',
      contact: '+91 124 496 2200',
      email: 'fmri@fortishealthcare.com',
      bedsAvailable: 18,
      facilities: ['Radiation Oncology', 'ICU', 'Chemotherapy', 'Emergency Response'],
      latitude: 28.4595,
      longitude: 77.0726
    }
  });

  const max = await prisma.hospital.create({
    data: {
      name: 'Max Super Speciality Hospital',
      address: '1 & 2, Press Enclave Road, Saket, New Delhi',
      city: 'New Delhi',
      contact: '+91 11 2651 5050',
      email: 'saket@maxhealthcare.com',
      bedsAvailable: 30,
      facilities: ['Immunotherapy', 'Surgical Oncology', 'Oncology ER'],
      latitude: 28.5284,
      longitude: 77.2198
    }
  });

  console.log('Seeded 3 oncology-capable hospitals.');

  // 3. Seed Pharmacies
  console.log('Seeding pharmacies...');
  const apolloPharmacy = await prisma.pharmacy.create({
    data: {
      name: 'Apollo Pharmacy',
      address: 'Greater Kailash II, New Delhi',
      contact: '+91 11 4050 6070',
      latitude: 28.5355,
      longitude: 77.2631
    }
  });

  const medplusPharmacy = await prisma.pharmacy.create({
    data: {
      name: 'MedPlus Chemist',
      address: 'Sector 15, Gurugram',
      contact: '+91 124 400 5000',
      latitude: 28.4595,
      longitude: 77.0266
    }
  });

  const fortisPharmacy = await prisma.pharmacy.create({
    data: {
      name: 'Fortis Medstore',
      address: 'Saket, New Delhi',
      contact: '+91 11 4166 7788',
      latitude: 28.5300,
      longitude: 77.2000
    }
  });

  console.log('Seeded 3 partner pharmacies.');

  // 4. Seed Doctors
  console.log('Seeding doctors...');
  const doctorsData = [
    {
      name: 'Dr. Sarah Wilson',
      username: 'sarah_wilson',
      specialist: 'Oncologist',
      experience: 15,
      email: 'sarah.wilson@medcan.com',
      password: 'password123',
      hospitalId: medanta.id
    },
    {
      name: 'Dr. James Chen',
      username: 'james_chen',
      specialist: 'Hematologist',
      experience: 12,
      email: 'james.chen@medcan.com',
      password: 'password123',
      hospitalId: fortis.id
    },
    {
      name: 'Dr. Emily Rodriguez',
      username: 'emily_rodriguez',
      specialist: 'Radiation Oncologist',
      experience: 10,
      email: 'emily.rodriguez@medcan.com',
      password: 'password123',
      hospitalId: max.id
    },
    {
      name: 'Dr. Michael Chang',
      username: 'michael_chang',
      specialist: 'Surgical Oncologist',
      experience: 20,
      email: 'michael.chang@medcan.com',
      password: 'password123',
      hospitalId: medanta.id
    },
    {
      name: 'Dr. Lisa Patel',
      username: 'lisa_patel',
      specialist: 'Pediatric Oncologist',
      experience: 8,
      email: 'lisa.patel@medcan.com',
      password: 'password123',
      hospitalId: fortis.id
    }
  ];

  // Helper to generate next 7 days dates
  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  const dates = getNext7Days();
  const times = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  for (const doc of doctorsData) {
    const hashedPassword = await bcrypt.hash(doc.password, 10);
    const doctor = await prisma.doctor.create({
      data: {
        name: doc.name,
        username: doc.username,
        specialist: doc.specialist,
        experience: doc.experience,
        email: doc.email,
        password: hashedPassword,
        hospitalId: doc.hospitalId,
        role: 'DOCTOR'
      }
    });
    console.log(`Created doctor: ${doctor.name}`);

    // Create slots for the next 7 days
    const slotsData = [];
    for (const date of dates) {
        for (const time of times) {
            slotsData.push({
                date: date,
                time: time,
                status: 'AVAILABLE',
                doctorId: doctor.id
            });
        }
    }
    await prisma.timeSlot.createMany({ data: slotsData });
    console.log(`Seeded slots for ${doctor.name}`);
  }

  // 5. Seed Admins
  console.log('Seeding admins...');
  const admins = [
    { username: 'admin@canqure.com', password: 'admin123', role: 'SYSTEM_ADMIN' },
    { username: 'hospital@canqure.com', password: 'hospital123', role: 'HOSPITAL_ADMIN', hospitalId: medanta.id },
    { username: 'apollo@canqure.com', password: 'apollo123', role: 'PHARMACY_ADMIN', pharmacyId: apolloPharmacy.id },
    { username: 'medplus@canqure.com', password: 'medplus123', role: 'PHARMACY_ADMIN', pharmacyId: medplusPharmacy.id },
    { username: 'fortis@canqure.com', password: 'fortis123', role: 'PHARMACY_ADMIN', pharmacyId: fortisPharmacy.id }
  ];

  for (const adminData of admins) {
    const hashedPassword = await bcrypt.hash(adminData.password, 10);
    await prisma.admin.create({
      data: {
        username: adminData.username,
        password: hashedPassword,
        role: adminData.role,
        hospitalId: adminData.hospitalId || null,
        pharmacyId: adminData.pharmacyId || null
      }
    });
  }
  console.log('Seeded admins.');

  // 6. Seed Demo Patients
  console.log('Seeding patient users...');
  const patientHashPassword = await bcrypt.hash('patient123', 10);
  
  const john = await prisma.user.create({
    data: {
      username: 'patient_demo',
      email: 'patient@canqure.com',
      password: patientHashPassword,
      name: 'John Patient',
      role: 'PATIENT'
    }
  });

  const james = await prisma.user.create({
    data: {
      username: 'james_morrison',
      email: 'james@canqure.com',
      password: patientHashPassword,
      name: 'James Morrison',
      role: 'PATIENT'
    }
  });

  const clara = await prisma.user.create({
    data: {
      username: 'clara_oswald',
      email: 'clara@canqure.com',
      password: patientHashPassword,
      name: 'Clara Oswald',
      role: 'PATIENT'
    }
  });

  const robert = await prisma.user.create({
    data: {
      username: 'robert_baratheon',
      email: 'robert@canqure.com',
      password: patientHashPassword,
      name: 'Robert Baratheon',
      role: 'PATIENT'
    }
  });

  // Seed CancerTypes for patients
  await prisma.cancerType.create({
    data: {
      name: 'Breast Cancer',
      stage: 2,
      description: 'Invasive ductal carcinoma, hormone receptor positive',
      symptoms: 'Mild fatigue, localized pain',
      treatments: 'Hormone therapy (Tamoxifen), targeted therapy',
      userId: john.id
    }
  });

  await prisma.cancerType.create({
    data: {
      name: 'Lung Cancer',
      stage: 4,
      description: 'Adenocarcinoma of the lung, EGFR mutation positive',
      symptoms: 'Persistent cough, mild shortness of breath',
      treatments: 'Targeted immunotherapy (Pembrolizumab)',
      userId: james.id
    }
  });

  await prisma.cancerType.create({
    data: {
      name: 'Breast Cancer',
      stage: 2,
      description: 'HER2 positive ductal carcinoma in situ',
      symptoms: 'Mild fatigue, localized discomfort',
      treatments: 'Hormone therapy (Tamoxifen), targeted therapy',
      userId: clara.id
    }
  });

  await prisma.cancerType.create({
    data: {
      name: 'Colon Cancer',
      stage: 3,
      description: 'Adenocarcinoma of the ascending colon',
      symptoms: 'Abdominal pain, fatigue',
      treatments: 'Adjuvant chemotherapy (FOLFOX)',
      userId: robert.id
    }
  });
  console.log('Seeded unique cancer types for all patients.');

  // 7. Seed Mock Appointments
  console.log('Seeding mock appointments and patient medicines...');
  const docForApt = await prisma.doctor.findFirst();
  if (docForApt) {
    const now = new Date();
    
    // James' medicines
    await prisma.medicine.create({
      data: {
        medName: 'Pembrolizumab 100mg',
        description: 'PD-1 receptor blocker immunotherapy.',
        dose: '200mg IV',
        frequency: 'Every 3 weeks',
        startDate: new Date(now.getTime() - 10 * 86400000),
        endDate: new Date(now.getTime() + 11 * 86400000),
        userId: james.id,
        doctorId: docForApt.id
      }
    });
    await prisma.medicine.create({
      data: {
        medName: 'Ondansetron 8mg',
        description: 'Antiemetic for nausea prevention.',
        dose: '8mg Oral',
        frequency: 'As needed',
        startDate: new Date(now.getTime() - 11 * 86400000),
        endDate: new Date(now.getTime() + 3 * 86400000),
        userId: james.id,
        doctorId: docForApt.id
      }
    });
    await prisma.medicine.create({
      data: {
        medName: 'Prednisolone 10mg',
        description: 'Corticosteroid to manage side effects.',
        dose: '10mg Oral',
        frequency: 'Once daily',
        startDate: new Date(now.getTime() - 22 * 86400000),
        endDate: new Date(now.getTime() + 6 * 86400000),
        userId: james.id,
        doctorId: docForApt.id
      }
    });

    // Clara's medicines
    await prisma.medicine.create({
      data: {
        medName: 'Tamoxifen 20mg',
        description: 'Estrogen receptor blocker hormone therapy.',
        dose: '20mg Oral',
        frequency: 'Once daily',
        startDate: new Date(now.getTime() - 12 * 86400000),
        endDate: new Date(now.getTime() + 18 * 86400000),
        userId: clara.id,
        doctorId: docForApt.id
      }
    });
    await prisma.medicine.create({
      data: {
        medName: 'Imatinib 400mg',
        description: 'Tyrosine kinase inhibitor targeted therapy.',
        dose: '400mg Oral',
        frequency: 'Once daily',
        startDate: new Date(now.getTime() - 25 * 86400000),
        endDate: new Date(now.getTime() + 5 * 86400000),
        userId: clara.id,
        doctorId: docForApt.id
      }
    });

    // Robert's medicines
    await prisma.medicine.create({
      data: {
        medName: 'Capecitabine 1500mg',
        description: 'Fluorouracil prodrug oral chemotherapy.',
        dose: '1500mg Oral',
        frequency: 'Twice daily for 14 days',
        startDate: new Date(now.getTime() - 5 * 86400000),
        endDate: new Date(now.getTime() + 9 * 86400000),
        userId: robert.id,
        doctorId: docForApt.id
      }
    });
    await prisma.medicine.create({
      data: {
        medName: 'Oxaliplatin 100mg',
        description: 'Platinum-based alkylating agent chemotherapy.',
        dose: '100mg IV',
        frequency: 'Every 3 weeks',
        startDate: new Date(now.getTime() - 0 * 86400000),
        endDate: new Date(now.getTime() + 21 * 86400000),
        userId: robert.id,
        doctorId: docForApt.id
      }
    });
    console.log('Seeded patient medicines successfully.');

    const mockAppointments = [
      { date: dates[0], time: '10:00', patientName: 'James Morrison', userId: james.id, doctorId: docForApt.id, urgencyLevel: 'URGENT', status: 'SCHEDULED', hospitalId: medanta.id },
      { date: dates[1], time: '11:00', patientName: 'Clara Oswald', userId: clara.id, doctorId: docForApt.id, urgencyLevel: 'NORMAL', status: 'SCHEDULED', hospitalId: medanta.id },
      { date: dates[2], time: '14:00', patientName: 'Robert Baratheon', userId: robert.id, doctorId: docForApt.id, urgencyLevel: 'NORMAL', status: 'SCHEDULED', hospitalId: medanta.id }
    ];

    for (const appt of mockAppointments) {
      // Find matching timeslot for the doctor
      const slot = await prisma.timeSlot.findFirst({
        where: {
          doctorId: appt.doctorId,
          date: appt.date,
          time: appt.time
        }
      });
      
      const apptData = { ...appt };
      if (slot) {
        apptData.timeSlotId = slot.id;
      }
      
      await prisma.appointment.create({ data: apptData });
      
      if (slot) {
        await prisma.timeSlot.update({
          where: { id: slot.id },
          data: { status: 'BOOKED' }
        });
      }
    }
    console.log('Seeded mock appointments.');
  }

  // 8. Seed Mock Refill Orders
  console.log('Seeding mock refill orders...');
  if (john) {
    const mockRefills = [
      {
        medName: 'Imatinib 400mg',
        patientName: john.name || 'John Patient',
        patientId: john.id,
        pharmacyId: apolloPharmacy.id,
        price: '₹2,000',
        status: 'PENDING',
        deliveryTime: '2 hours',
        daysRemaining: 3
      },
      {
        medName: 'Doxorubicin 50mg',
        patientName: john.name || 'John Patient',
        patientId: john.id,
        pharmacyId: medplusPharmacy.id,
        price: '₹4,500',
        status: 'PREPARING',
        deliveryTime: '1 day',
        daysRemaining: 12
      },
      {
        medName: 'Pembrolizumab 100mg',
        patientName: john.name || 'John Patient',
        patientId: john.id,
        pharmacyId: fortisPharmacy.id,
        price: '₹85,000',
        status: 'DELIVERED',
        deliveryTime: '4 hours',
        daysRemaining: 8
      }
    ];

    for (const refill of mockRefills) {
      await prisma.refillOrder.create({ data: refill });
    }
    console.log('Seeded mock refill orders.');
  }

  console.log('Database seeding complete successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
