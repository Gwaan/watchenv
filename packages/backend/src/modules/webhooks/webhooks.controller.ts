import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { GitlabDeploymentEventSchema } from './dto/gitlab-webhook.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('gitlab')
  @HttpCode(200)
  async handleGitlab(@Headers('x-gitlab-token') token: string, @Body() body: unknown) {
    const result = GitlabDeploymentEventSchema.safeParse(body);
    if (!result.success) return;

    await this.webhooksService.processDeploymentEvent(token, result.data);
  }
}
