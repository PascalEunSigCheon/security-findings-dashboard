import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { VulnerabilitiesService } from './vulnerabilities.service.js';
import { Vulnerability } from './entities/vulnerability.entity.js';
import { CreateVulnerabilityInput } from './dto/create-vulnerability.input.js';
import { UpdateVulnerabilityInput } from './dto/update-vulnerability.input.js';

@Resolver(() => Vulnerability)
export class VulnerabilitiesResolver {
  constructor(
    private readonly vulnerabilitiesService: VulnerabilitiesService,
  ) {}

  @Mutation(() => Vulnerability)
  createVulnerability(
    @Args('createVulnerabilityInput')
    createVulnerabilityInput: CreateVulnerabilityInput,
  ) {
    return this.vulnerabilitiesService.create(createVulnerabilityInput);
  }

  @Query(() => [Vulnerability], { name: 'vulnerabilities' })
  findAll() {
    console.log('find all resolver');
    return this.vulnerabilitiesService.findAll();
  }

  @Query(() => Vulnerability, { name: 'vulnerability' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.vulnerabilitiesService.findOne(id);
  }

  @Mutation(() => Vulnerability)
  updateVulnerability(
    @Args('updateVulnerabilityInput')
    updateVulnerabilityInput: UpdateVulnerabilityInput,
  ) {
    return this.vulnerabilitiesService.update(
      updateVulnerabilityInput.id,
      updateVulnerabilityInput,
    );
  }

  @Mutation(() => Vulnerability)
  removeVulnerability(@Args('id', { type: () => Int }) id: number) {
    return this.vulnerabilitiesService.remove(id);
  }
}
