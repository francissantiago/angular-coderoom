import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<Record<string, unknown> | null> {
    const user = await this.userModel.findOne({ where: { email } });
    this.logger.debug(`Validating user: ${email} | found=${!!user}`);

    // Guard against missing hashed password (bcrypt.compare requires both args)
    if (!user || !user.password) {
      this.logger.warn(
        `No stored password for user or user not found: ${email}`,
      );
      return null;
    }

    try {
      const dbPassword = user.password;
      const passwordMatches = await bcrypt.compare(password, dbPassword ?? '');
      if (passwordMatches) {
        this.logger.debug(`Password match for: ${email}`);
        const fullRaw: unknown = user.toJSON();
        const full =
          typeof fullRaw === 'object' && fullRaw !== null
            ? (fullRaw as Record<string, unknown>)
            : ({} as Record<string, unknown>);
        const sanitized = { ...full };
        delete (sanitized as { password?: unknown }).password;
        return sanitized as Record<string, unknown>;
      }
      this.logger.debug(`Invalid credentials for: ${email}`);
      return null;
    } catch (error: unknown) {
      this.logger.error(
        `Error validating password for user ${email} - ${String(error)}`,
      );
      return null;
    }
  }

  login(user: { email: string; id: number; role?: string; name?: string }): {
    access_token: string;
  } {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      name: user.name,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
