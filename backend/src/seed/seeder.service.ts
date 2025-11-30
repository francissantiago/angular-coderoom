import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger(SeederService.name);
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = 'admin@coderoom.com';
    let user = await this.userModel.findOne({ where: { email: adminEmail } });

    if (!user) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      user = await this.userModel.create({
        name: 'Administrador Geral',
        email: adminEmail,
        role: 'teacher',
        password: hashedPassword,
      });
      this.logger.log('Admin user created successfully');
    } else if (!user.password) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await user.update({ password: hashedPassword });
      this.logger.log('Admin user password updated');
    } else {
      this.logger.log('Admin user already exists with password');
    }
  }
}
