import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
});

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface VulnerabilityRecord {
  source: 'nvd';
  externalId: string;
  title: string;
  description: string | null;
  severity: Severity | null;
  cvssScore: number | null;
  publishedAt: string | null;
  sourceUrl: string | null;
  rawData: unknown;
}

interface NvdCve {
  id: string;
  descriptions?: Array<{ lang: string; value: string }>;
  published?: string;
  metrics?: Record<
    string,
    Array<{
      cvssData?: {
        baseScore?: number;
        baseSeverity?: string;
      };
    }>
  >;
}

interface NvdFile {
  vulnerabilities?: Array<{ cve: NvdCve }>;
}

function normalizeSeverity(value: string | undefined | null): Severity | null {
  const normalized = value?.toLowerCase();

  if (
    normalized === 'critical' ||
    normalized === 'high' ||
    normalized === 'medium' ||
    normalized === 'low' ||
    normalized === 'info'
  ) {
    return normalized;
  }

  return null;
}

function severityFromScore(score: number): Severity {
  if (score >= 9) return 'critical';
  if (score >= 7) return 'high';
  if (score >= 4) return 'medium';
  if (score > 0) return 'low';
  return 'info';
}

function parseNvd(data: NvdFile): VulnerabilityRecord[] {
  return (data.vulnerabilities ?? []).map(({ cve }) => {
    const description =
      cve.descriptions?.find((item) => item.lang === 'en')?.value ?? null;

    const metrics = cve.metrics ?? {};

    // Prefer newer CVSS versions when available.
    const metricNames = [
      'cvssMetricV40',
      'cvssMetricV31',
      'cvssMetricV30',
      'cvssMetricV2',
    ];

    let score: number | null = null;
    let severity: Severity | null = null;

    for (const name of metricNames) {
      const metric = metrics[name]?.[0]?.cvssData;
      if (!metric) continue;

      score = metric.baseScore ?? null;
      severity = normalizeSeverity(metric.baseSeverity);

      if (!severity && score !== null) {
        severity = severityFromScore(score);
      }

      if (score !== null || severity !== null) break;
    }

    return {
      source: 'nvd',
      externalId: cve.id,
      title: cve.id,
      description,
      severity,
      cvssScore: score,
      publishedAt: cve.published ?? null,
      sourceUrl: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
      rawData: cve,
    };
  });
}
async function createTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vulnerabilities (
      id BIGSERIAL PRIMARY KEY,
      source VARCHAR(30) NOT NULL,
      external_id VARCHAR(100) NOT NULL,
      title TEXT,
      description TEXT,
      severity VARCHAR(20),
      cvss_score NUMERIC(3, 1),
      published_at TIMESTAMPTZ,
      source_url TEXT,
      raw_data JSONB,
      imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (source, external_id)
    );
  `);

  console.log('Vulnerabilities table is ready.');
}

async function importRecords(records: VulnerabilityRecord[]): Promise<void> {
  if (records.length === 0) {
    console.log('No records to import.');
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sql = `
      INSERT INTO vulnerabilities (
        source, external_id, title, description, severity,
        cvss_score, published_at, source_url, raw_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (source, external_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        severity = EXCLUDED.severity,
        cvss_score = EXCLUDED.cvss_score,
        published_at = EXCLUDED.published_at,
        source_url = EXCLUDED.source_url,
        raw_data = EXCLUDED.raw_data
    `;

    for (const record of records) {
      await client.query(sql, [
        record.source,
        record.externalId,
        record.title,
        record.description,
        record.severity,
        record.cvssScore,
        record.publishedAt,
        record.sourceUrl,
        JSON.stringify(record.rawData),
      ]);
    }

    await client.query('COMMIT');
    console.log(`Imported ${records.length} records.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function readJson<T>(filename: string): Promise<T> {
  const fullPath = path.resolve(filename);
  const contents = await readFile(fullPath, 'utf8');
  return JSON.parse(contents) as T;
}

async function main(): Promise<void> {
  try {
    await createTable();
    const nvd = await readJson<NvdFile>('nvdcve-2.0-recent.json');

    await importRecords(parseNvd(nvd));
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error('Import failed:', error);
  process.exitCode = 1;
});
