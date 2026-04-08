import * as fs from 'fs/promises';
import * as path from 'path';
import { CamelCasePlugin, FileMigrationProvider, Kysely, Migrator, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

const db = new Kysely<unknown>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString: process.env.DATABASE_URL }) }),
  plugins: [new CamelCasePlugin()],
});

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.resolve(__dirname, 'migrations'),
  }),
});

migrator
  .migrateToLatest()
  .then(({ error, results }) => {
    for (const result of results ?? []) {
      if (result.status === 'Success') {
        console.log(`✓ ${result.migrationName}`);
      } else if (result.status === 'Error') {
        console.error(`✗ ${result.migrationName}`);
      }
    }
    if (error) {
      console.error(error);
      process.exit(1);
    }
  })
  .finally(() => db.destroy());
