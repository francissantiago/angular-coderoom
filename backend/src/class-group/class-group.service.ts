import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassGroup } from '../models/class-group.model';
import { Lesson } from '../models/lesson.model';
import { Student } from '../models/student.model';

@Injectable()
export class ClassGroupService {
  constructor(
    @InjectModel(ClassGroup) private classGroupModel: typeof ClassGroup,
  ) {}

  async create(data: Partial<ClassGroup>): Promise<ClassGroup | null> {
    // Accept optional `studentIds` in dto to set associations on creation
    const studentIds = (data as any).studentIds as number[] | undefined;
    const payload = { ...data } as any;
    delete payload.studentIds;
    const group = await this.classGroupModel.create(payload);
    if (studentIds && Array.isArray(studentIds)) {
      // set association (will create entries in class_group_students)
      // @ts-ignore - Sequelize mixin
      await (group as any).$set('students', studentIds);
    }
    return this.findOne(group.id);
  }

  async findAll(): Promise<ClassGroup[]> {
    return this.classGroupModel.findAll({ include: [Lesson, Student] });
  }

  async findOne(id: number): Promise<ClassGroup | null> {
    return this.classGroupModel.findByPk(id, { include: [Lesson, Student] });
  }

  async update(
    id: number,
    data: Partial<ClassGroup>,
  ): Promise<ClassGroup | null> {
    const group = await this.findOne(id);
    if (!group) return null;
    const studentIds = (data as any).studentIds as number[] | undefined;
    const payload = { ...data } as any;
    delete payload.studentIds;
    await group.update(payload);
    if (studentIds && Array.isArray(studentIds)) {
      // update associations
      // @ts-ignore
      await (group as any).$set('students', studentIds);
    }
    return this.findOne(group.id);
  }

  async remove(id: number): Promise<boolean> {
    const group = await this.findOne(id);
    if (!group) return false;
    await group.destroy();
    return true;
  }
}
