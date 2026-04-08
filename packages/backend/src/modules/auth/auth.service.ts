import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createId } from '@paralleldrive/cuid2';
import axios from 'axios';
import type { Kysely } from 'kysely';
import { DB } from '../../db/db.module';
import type { Database } from '../../db/types';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    @Inject(DB) private db: Kysely<Database>
  ) {}

  buildGitlabAuthorizationUrl(): string {
    const gitlabUrl = this.config.getOrThrow('GITLAB_URL');
    const clientId = this.config.getOrThrow('GITLAB_CLIENT_ID');
    const redirectUri = `${this.config.getOrThrow('APP_URL')}/api/auth/gitlab/callback`;
    const url = new URL(`${gitlabUrl}/oauth/authorize`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'read_user');
    url.searchParams.set('state', crypto.randomUUID());
    return url.toString();
  }

  async authenticateWithGitlab(code: string): Promise<{ token: string }> {
    const gitlabUrl = this.config.getOrThrow('GITLAB_URL');
    const redirectUri = `${this.config.getOrThrow('APP_URL')}/api/auth/gitlab/callback`;

    const { data: tokenData } = await axios.post(`${gitlabUrl}/oauth/token`, {
      client_id: this.config.getOrThrow('GITLAB_CLIENT_ID'),
      client_secret: this.config.getOrThrow('GITLAB_CLIENT_SECRET'),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
    });

    const { data: profile } = await axios.get(`${gitlabUrl}/api/v4/user`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const user = await this.db
      .insertInto('users')
      .values({
        id: createId(),
        gitlabId: profile.id,
        username: profile.username,
        email: profile.email,
        displayName: profile.name,
        avatarUrl: profile.avatar_url ?? null,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token ?? null,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      })
      .onConflict((oc) =>
        oc.column('gitlabId').doUpdateSet({
          username: profile.username,
          email: profile.email,
          displayName: profile.name,
          avatarUrl: profile.avatar_url ?? null,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token ?? null,
          tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          updatedAt: new Date(),
        })
      )
      .returningAll()
      .executeTakeFirstOrThrow();

    return {
      token: this.jwt.sign({ sub: user.id, username: user.username, email: user.email }),
    };
  }

  async findCurrentUser(userId: string) {
    return this.db
      .selectFrom('users')
      .select(['id', 'gitlabId', 'username', 'email', 'displayName', 'avatarUrl', 'createdAt'])
      .where('id', '=', userId)
      .executeTakeFirst();
  }
}
