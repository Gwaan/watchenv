import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SyncModule } from '../sync/sync.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
    forwardRef(() => SyncModule),
  ],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
