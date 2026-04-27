import { Body, Controller, Headers, HttpCode, Logger, Post } from '@nestjs/common';
import { GitlabDeploymentEventSchema } from './dto/gitlab-webhook.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('gitlab')
  @HttpCode(200)
  async handleGitlab(@Headers('x-gitlab-token') token: string, @Body() body: unknown) {
    const result = GitlabDeploymentEventSchema.safeParse(body);
    await this.webhooksService.processDeploymentEvent(token, result.data!);
  }
}
