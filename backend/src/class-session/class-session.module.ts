import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClassSession } from '../models/class-session.model';
import { ClassSessionService } from './class-session.service';
import { ClassSessionController } from './class-session.controller';

@Module({
  imports: [SequelizeModule.forFeature([ClassSession])],
  controllers: [ClassSessionController],
  providers: [ClassSessionService],
  exports: [ClassSessionService],
})
export class ClassSessionModule {}
