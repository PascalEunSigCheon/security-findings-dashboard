import { Injectable } from '@nestjs/common';
import { CreateVulnerabilityInput } from './dto/create-vulnerability.input.js';
import { UpdateVulnerabilityInput } from './dto/update-vulnerability.input.js';
import { db } from '../prisma/db.js';

@Injectable()
export class VulnerabilitiesService {
  private vulnerabilities = [
    {
      id: 1,
      source: 'NVD',
      externalId: 'CVE-2025-12345',
      title: 'Example vulnerability',
      description: 'A sample vulnerability for testing.',
      severity: 'HIGH',
      cvssScore: 8.1,
      publishedAt: new Date('2025-01-15T00:00:00Z'),
      sourceUrl: 'https://nvd.nist.gov/',
      rawData: { example: true },
      importedAt: new Date(),
    },
  ];
  create(createVulnerabilityInput: CreateVulnerabilityInput) {
    return 'This action adds a new vulnerability';
  }

  async findAll() {
    const vulnerabilities = await db.orm.public.Vulnerabilities.select(
      'source',
      'title',
      'description',
      'severity',
      'cvssScore',
      'publishedAt',
      'sourceUrl',
    )
      .limit(2)
      .all();
    return vulnerabilities;
  }

  findOne(id: number) {
    return `This action returns a #${id} vulnerability`;
  }

  update(id: number, updateVulnerabilityInput: UpdateVulnerabilityInput) {
    return `This action updates a #${id} vulnerability`;
  }

  remove(id: number) {
    return `This action removes a #${id} vulnerability`;
  }
}
