import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { User } from '../models/user.model';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ where: { email } });
    console.log('Validating user:', email, 'User found:', !!user);

    // Guard against missing hashed password (bcrypt.compare requires both args)
    if (!user || !user.password) {
      console.log('No stored password for user or user not found:', email, !!user?.password);
      return null;
    }

    try {
      const passwordMatches = await bcrypt.compare(password, user.password);
      if (passwordMatches) {
        console.log('Password match for:', email);
        const { password, ...result } = user.toJSON();
        return result;
      }
      console.log('Invalid credentials for:', email);
      return null;
    } catch (error) {
      console.error('Error validating password for user', email, error);
      return null;
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}