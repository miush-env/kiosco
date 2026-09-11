import postgres from 'postgres';

const url = 'postgres://postgres.mcdmomgmfngaxrlyzjtz:agsKZ5d0btcbb3oZ@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';
const sql = postgres(url, { ssl: { rejectUnauthorized: false } });

async function clearData() {
  console.log('Connecting to Supabase PostgreSQL...');
  
  const beforeProds = await sql`SELECT count(*) FROM products;`;
  const beforeInv = await sql`SELECT count(*) FROM inventory;`;
  console.log(`Initial count: ${beforeProds[0].count} products, ${beforeInv[0].count} inventory items.`);

  console.log('Deleting all products...');
  await sql`DELETE FROM products;`;

  console.log('Deleting all inventory items (ingredients)...');
  await sql`DELETE FROM inventory;`;

  const afterProds = await sql`SELECT count(*) FROM products;`;
  const afterInv = await sql`SELECT count(*) FROM inventory;`;
  console.log(`Final count: ${afterProds[0].count} products, ${afterInv[0].count} inventory items.`);

  console.log('Database cleared successfully.');
  process.exit(0);
}

clearData().catch((err) => {
  console.error('Error clearing data:', err);
  process.exit(1);
});
