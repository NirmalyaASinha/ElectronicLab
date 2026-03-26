import { sql } from '@vercel/postgres';

async function createOtpsTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS "otps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" text NOT NULL,
        "code" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "is_used" boolean DEFAULT false NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `;
    
    // Use the database connection from the app
    const { db } = await import('../src/db/index.js');
    console.log('Creating otps table...');
    
    // Execute raw SQL
    await db.execute(query);
    
    console.log('✅ otps table created successfully!');
  } catch (error) {
    console.error('❌ Error creating otps table:', error);
    process.exit(1);
  }
}

createOtpsTable();
