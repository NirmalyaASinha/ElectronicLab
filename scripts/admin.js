#!/usr/bin/env node
/**
 * E-Lab Admin Management Script
 * Create admin users and manage faculty/students using Node.js
 * This ensures bcryptjs hashing is compatible with NextAuth authentication
 */

import { createClient } from '@vercel/postgres';
import bcryptjs from 'bcryptjs';
import { randomUUID } from 'crypto';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const db = createClient();

async function connect() {
  try {
    await db.connect();
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function hashPassword(password) {
  const salt = await bcryptjs.genSalt(10);
  return bcryptjs.hash(password, salt);
}

async function createAdmin(email, name, password) {
  try {
    const passwordHash = await hashPassword(password);
    const id = randomUUID();

    const result = await db.query(
      `INSERT INTO users (id, email, name, password_hash, role, department, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, name, role`,
      [id, email, name, passwordHash, 'ADMIN', 'Administration', true]
    );

    console.log('\n✅ Admin created successfully!');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ADMIN\n`);
    return result.rows[0];
  } catch (error) {
    if (error.message.includes('unique')) {
      console.error(`❌ Error: Email already exists`);
    } else {
      console.error(`❌ Error creating admin:`, error.message);
    }
    return null;
  }
}

async function createFaculty(email, name, password, department, employeeId) {
  try {
    const passwordHash = await hashPassword(password);
    const id = randomUUID();

    await db.query(
      `INSERT INTO users (id, email, name, password_hash, role, department, employee_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, email, name, passwordHash, 'FACULTY', department, employeeId, true]
    );

    console.log(`✅ Faculty created: ${name} (${email})`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating faculty:`, error.message);
    return false;
  }
}

async function createStudent(email, name, password, department, rollNumber, semester) {
  try {
    const passwordHash = await hashPassword(password);
    const id = randomUUID();

    await db.query(
      `INSERT INTO users (id, email, name, password_hash, role, department, roll_number, semester, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [id, email, name, passwordHash, 'STUDENT', department, rollNumber, parseInt(semester), true]
    );

    console.log(`✅ Student created: ${name} (${email}) - Sem ${semester}`);
    return true;
  } catch (error) {
    console.error(`❌ Error creating student:`, error.message);
    return false;
  }
}

async function viewAllUsers() {
  try {
    const result = await db.query(
      `SELECT id, email, name, role, department, is_active 
       FROM users 
       ORDER BY role, name`
    );

    if (result.rows.length > 0) {
      console.log(`\n📋 All Users (${result.rows.length} found):`);
      console.log('-'.repeat(80));
      result.rows.forEach((user) => {
        const status = user.is_active ? '✓' : '✗';
        console.log(
          `  [${status}] ${user.role.padEnd(8)} | ${user.name.padEnd(25)} | ${user.email}`
        );
      });
      console.log('-'.repeat(80) + '\n');
    } else {
      console.log('❌ No users found');
    }
  } catch (error) {
    console.error(`❌ Error reading users:`, error.message);
  }
}

function showMenu() {
  console.log('\n' + '='.repeat(60));
  console.log('        E-Lab Admin Management System');
  console.log('='.repeat(60));
  console.log('\n📌 ADMIN OPERATIONS:');
  console.log('  1. Create Admin User');
  console.log('\n📌 FACULTY OPERATIONS:');
  console.log('  2. Create Faculty');
  console.log('\n📌 STUDENT OPERATIONS:');
  console.log('  3. Create Student');
  console.log('\n📌 GENERAL:');
  console.log('  4. View All Users');
  console.log('  0. Exit');
  console.log('='.repeat(60) + '\n');
}

async function main() {
  await connect();

  while (true) {
    showMenu();
    const choice = await question('Enter your choice (0-4): ');

    if (choice === '1') {
      const email = await question('Admin Email: ');
      const name = await question('Admin Name: ');
      const password = await question('Admin Password: ');
      if (email && name && password) {
        await createAdmin(email.trim(), name.trim(), password.trim());
      }
    } else if (choice === '2') {
      const email = await question('Faculty Email: ');
      const name = await question('Faculty Name: ');
      const password = await question('Password: ');
      const department = await question('Department (default: Electronics): ');
      const employeeId = await question('Employee ID: ');
      if (email && name && password && employeeId) {
        await createFaculty(
          email.trim(),
          name.trim(),
          password.trim(),
          department.trim() || 'Electronics',
          employeeId.trim()
        );
      }
    } else if (choice === '3') {
      const email = await question('Student Email: ');
      const name = await question('Student Name: ');
      const password = await question('Password: ');
      const department = await question('Department (default: Electronics): ');
      const rollNumber = await question('Roll Number: ');
      const semester = await question('Semester (1-8): ');
      if (email && name && password && rollNumber && semester) {
        await createStudent(
          email.trim(),
          name.trim(),
          password.trim(),
          department.trim() || 'Electronics',
          rollNumber.trim(),
          semester.trim()
        );
      }
    } else if (choice === '4') {
      await viewAllUsers();
    } else if (choice === '0') {
      console.log('\n👋 Goodbye!\n');
      break;
    } else {
      console.log('❌ Invalid choice. Please try again.');
    }
  }

  await db.end();
  rl.close();
}

main().catch(console.error);
