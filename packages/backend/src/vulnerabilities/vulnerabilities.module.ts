import { Module } from '@nestjs/common';
import { VulnerabilitiesService } from './vulnerabilities.service.js';
import { VulnerabilitiesResolver } from './vulnerabilities.resolver.js';

@Module({
  providers: [VulnerabilitiesResolver, VulnerabilitiesService],
})
export class VulnerabilitiesModule {}
