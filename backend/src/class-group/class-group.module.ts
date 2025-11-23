import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClassGroup } from '../models/class-group.model';
import { ClassGroupService } from './class-group.service';
import { ClassGroupController } from './class-group.controller';

@Module({
  imports: [SequelizeModule.forFeature([ClassGroup])],
  controllers: [ClassGroupController],
  providers: [ClassGroupService],
  exports: [ClassGroupService],
})
export class ClassGroupModule {}
