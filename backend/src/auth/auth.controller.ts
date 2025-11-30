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
    // `validateUser` returns a sanitized object that may have optional fields
    // cast to the shape expected by `login` since the guard ensures presence
    const safeUser = user as { email: string; id: number; role?: string; name?: string };
    return this.authService.login(safeUser);
  }
}
