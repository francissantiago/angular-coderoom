import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassGroup } from '../models/class-group.model';

@Injectable()
export class ClassGroupService {
  constructor(@InjectModel(ClassGroup) private classGroupModel: typeof ClassGroup) {}

  async create(data: Partial<ClassGroup>): Promise<ClassGroup> {
    return this.classGroupModel.create(data as any);
  }

  async findAll(): Promise<ClassGroup[]> {
    return this.classGroupModel.findAll();
  }

  async findOne(id: number): Promise<ClassGroup | null> {
    return this.classGroupModel.findByPk(id);
  }

  async update(id: number, data: Partial<ClassGroup>): Promise<ClassGroup | null> {
    const group = await this.findOne(id);
    if (!group) return null;
    return group.update(data as any);
  }

  async remove(id: number): Promise<boolean> {
    const group = await this.findOne(id);
    if (!group) return false;
    await group.destroy();
    return true;
  }
}
