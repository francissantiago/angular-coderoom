import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from '../models/student.model';

@Module({
  imports: [SequelizeModule.forFeature([Student])],
  controllers: [StudentsController],
  providers: [StudentsService],
})
export class StudentsModule {}
