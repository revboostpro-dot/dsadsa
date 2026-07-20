const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ─── Settings ───────────────────────────────────────────────────────────────
  const settings = [
    { key: 'payPerQr',       value: '5',    label: 'Pay Per QR (₹)',          type: 'number'  },
    { key: 'maxBatchSize',   value: '5',    label: 'Maximum Batch Size',       type: 'number'  },
    { key: 'cooldownHours',  value: '24',   label: 'Cooldown Hours',           type: 'number'  },
    { key: 'lockTimeout',    value: '15',   label: 'Lock Timeout (minutes)',   type: 'number'  },
    { key: 'currency',       value: 'INR',  label: 'Currency',                 type: 'string'  },
    { key: 'timezone',       value: 'Asia/Kolkata', label: 'Timezone',         type: 'string'  },
  ];

  for (const setting of settings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Settings seeded');

  // ─── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('password123', 12);

  const admin = await prisma.user.upsert({
    where: { phone: '9000000000' },
    update: {},
    create: {
      phone: '9000000000',
      password: passwordHash,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  const supervisors = [
    { phone: '9111111111', name: 'Rahul Sharma' },
    { phone: '9222222222', name: 'Swapnil Patil' },
    { phone: '9333333333', name: 'Priya Singh' },
    { phone: '9444444444', name: 'Amit Kumar' },
  ];

  const createdSupervisors = [];
  for (const sup of supervisors) {
    const user = await prisma.user.upsert({
      where: { phone: sup.phone },
      update: {},
      create: {
        phone: sup.phone,
        password: passwordHash,
        name: sup.name,
        role: 'SUPERVISOR',
      },
    });
    createdSupervisors.push(user);
  }
  console.log('✅ Users seeded (1 admin + 4 supervisors)');

  // ─── Workers ─────────────────────────────────────────────────────────────────
  const workerNames = [
    'Arjun Mehta', 'Kavita Rao', 'Suresh Nair', 'Deepika Patel',
    'Ravi Gupta', 'Sunita Sharma', 'Manish Singh', 'Pooja Verma',
    'Anil Kumar', 'Rekha Joshi', 'Vikram Das', 'Neha Agarwal',
    'Santosh Yadav', 'Meena Tiwari', 'Rajesh Pandey', 'Lata Mishra',
    'Dinesh Sahu', 'Anita Dubey', 'Kiran Thakur', 'Sanjay Bhatt',
  ];

  const statuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'COOLDOWN', 'AVAILABLE'];

  for (let i = 0; i < workerNames.length; i++) {
    const workerNum = String(i + 1).padStart(3, '0');
    const status = statuses[i % statuses.length];
    const supervisor = createdSupervisors[i % createdSupervisors.length];

    const cooldownUntil = status === 'COOLDOWN'
      ? new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
      : null;

    await prisma.worker.upsert({
      where: { workerId: `W-${workerNum}` },
      update: {},
      create: {
        workerId: `W-${workerNum}`,
        name: workerNames[i],
        phone: `98${String(10000000 + i).slice(1)}`,
        upiId: `${workerNames[i].toLowerCase().replace(' ', '')}@upi`,
        paymentMethod: 'UPI',
        balance: Math.floor(Math.random() * 500),
        lifetimePassed: Math.floor(Math.random() * 100),
        lifetimeFailed: Math.floor(Math.random() * 20),
        status,
        cooldownUntil,
        supervisorId: supervisor.id,
      },
    });
  }
  console.log('✅ 20 sample workers seeded');

  console.log('\n🎉 Seed complete!');
  console.log('─────────────────────────────');
  console.log('Admin login:      9000000000 / password123');
  console.log('Supervisor login: 9111111111 / password123');
  console.log('─────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
