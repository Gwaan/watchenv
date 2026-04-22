import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeploymentsService } from './deployments.service';

@UseGuards(JwtAuthGuard)
@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get('environment/:environmentId')
  findByEnvironment(@Param('environmentId') environmentId: string) {
    return this.deploymentsService.findByEnvironment(environmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deploymentsService.findOne(id);
  }
}
