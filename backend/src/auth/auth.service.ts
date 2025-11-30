import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
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
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
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
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (passwordMatches) {
        this.logger.debug(`Password match for: ${email}`);
        const { password, ...result } = user.toJSON();
        return result;
      }
      this.logger.debug(`Invalid credentials for: ${email}`);
      return null;
    } catch (error) {
      this.logger.error(`Error validating password for user ${email}`, error);
      return null;
    }
  }

  async login(user: any) {
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
