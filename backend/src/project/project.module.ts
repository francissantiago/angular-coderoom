import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Project } from '../models/project.model';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

@Module({
  imports: [SequelizeModule.forFeature([Project])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
