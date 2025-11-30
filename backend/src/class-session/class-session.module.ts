import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClassSession } from '../models/class-session.model';
import { Lesson } from '../models/lesson.model';
import { ClassGroup } from '../models/class-group.model';
import { ClassSessionService } from './class-session.service';
import { ClassSessionController } from './class-session.controller';

@Module({
  imports: [SequelizeModule.forFeature([ClassSession, Lesson, ClassGroup])],
  controllers: [ClassSessionController],
  providers: [ClassSessionService],
  exports: [ClassSessionService],
})
export class ClassSessionModule {}
