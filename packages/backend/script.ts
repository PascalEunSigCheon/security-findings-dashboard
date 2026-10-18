import { db } from './src/prisma/db';

async function main() {
  console.log('hello');
  const users = await db.orm.public.Vulnerabilities.select(
    'id',
    'source',
    'externalId',
  )
    .limit(2)
    .all();

  console.log(users);

  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
