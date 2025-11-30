import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(
    @Request()
    req: ExpressRequest & {
      user: { email?: string; id?: number; role?: string; name?: string };
    },
  ) {
    const { user } = req;
    return this.authService.login(user);
  }
}
