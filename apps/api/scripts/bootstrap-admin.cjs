#!/usr/bin/env node
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const fullName = process.env.ADMIN_BOOTSTRAP_NAME?.trim();

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('ADMIN_BOOTSTRAP_EMAIL must be a valid email address');
  }
  if (!password || password.length < 16) {
    throw new Error('ADMIN_BOOTSTRAP_PASSWORD must contain at least 16 characters');
  }
  if (!fullName || fullName.length < 2 || fullName.length > 120) {
    throw new Error('ADMIN_BOOTSTRAP_NAME must contain 2–120 characters');
  }

  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount !== 0) {
      throw new Error('Bootstrap refused: the database already contains users. Use the normal administrator management flow.');
    }

    await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash: await bcrypt.hash(password, 12),
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });
    console.log('Initial SUPER_ADMIN account created. Password was not printed.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`Admin bootstrap failed: ${error.message}`);
  process.exitCode = 1;
});
