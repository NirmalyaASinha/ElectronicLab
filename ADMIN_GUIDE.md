# Admin User Management Guide

## Using the Node.js Admin Script

The Node.js admin script (`scripts/admin.js`) is the recommended way to manage users. It uses the same bcryptjs library as your authentication system, ensuring password hashes are compatible.

### Installation

The required dependencies are already installed in your project:
- `bcryptjs` - For password hashing
- `@vercel/postgres` - For database access

### Running the Script

```bash
# Make sure you're in the project root directory
cd /path/to/ElecTronic

# Run the admin script
node --require dotenv/config scripts/admin.js
```

### Features

1. **Create Admin User** - Create a new admin with full system access
2. **Create Faculty** - Add faculty members with employee ID and department
3. **Create Student** - Add students with roll number, semester, and department
4. **View All Users** - List all users in the system with their roles and status

### Why Node.js Instead of Python?

The Python bcrypt library and JavaScript bcryptjs can sometimes produce incompatible password hashes depending on salt rounds and algorithms. By using Node.js with bcryptjs for **both** creating and verifying passwords, we ensure 100% compatibility with your NextAuth authentication system.

### Important for Vercel Production

If you already have users created from the Python script and are getting "Invalid Email and password" errors, you'll need to:

1. Create at least one admin user with the Node.js script
2. Log in with that admin user
3. Use the web UI (`/admin/users/create`) to create other users going forward

This ensures all passwords are hashed with bcryptjs and will work properly.

### Example: Create an Admin User

```bash
$ node --require dotenv/config scripts/admin.js

✅ Connected to database

============================================================
        E-Lab Admin Management System
============================================================

📌 ADMIN OPERATIONS:
  1. Create Admin User
  ...

Enter your choice (0-4): 1
Admin Email: admin@elab.com
Admin Name: System Administrator
Admin Password: SecurePassword123

✅ Admin created successfully!
   Email: admin@elab.com
   Name: System Administrator
   Password: SecurePassword123
   Role: ADMIN
```

## Troubleshooting

### Error: "Invalid Email and password" in Vercel

**Cause:** Password hashes from the Python script may not be compatible with bcryptjs verification.

**Solution:** 
1. Create a new admin user with the Node.js script
2. Log in with that user
3. Create other users through the web UI or recreate them with the Node.js script

### Error: "Email already exists"

**Cause:** You're trying to create a user that already exists in the database.

**Solution:** Use a different email or delete the existing user first.

### Error: "Cannot connect to database"

**Cause:** DATABASE_URL environment variable is not set properly.

**Solution:** Make sure your `.env.local` file has a valid DATABASE_URL pointing to your Neon database.
