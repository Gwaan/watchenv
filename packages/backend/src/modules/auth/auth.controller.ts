import { Controller, Delete, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('gitlab/authorize')
  authorize() {
    return { url: this.authService.buildGitlabAuthorizationUrl() };
  }

  @Get('gitlab/callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    const { token } = await this.authService.authenticateWithGitlab(code);
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    res.redirect(`${process.env.APP_URL}/dashboard`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('session')
  async getSession(@CurrentUser() user: JwtPayload) {
    return this.authService.findCurrentUser(user.sub);
  }

  @Delete('session')
  logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.status(200).end();
  }
}
