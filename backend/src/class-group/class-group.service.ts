import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassGroup, ClassGroupWithMixins } from '../models/class-group.model';
import { Lesson } from '../models/lesson.model';
import { Student } from '../models/student.model';

@Injectable()
export class ClassGroupService {
  constructor(
    @InjectModel(ClassGroup) private classGroupModel: typeof ClassGroup,
  ) {}

  async create(
    data: Partial<ClassGroup> & { studentIds?: number[] },
  ): Promise<ClassGroupWithMixins | null> {
    // Accept optional `studentIds` in dto to set associations on creation
    const { studentIds, ...payload } = data;
    const group = (await this.classGroupModel.create(
      payload as Partial<ClassGroup>,
    )) as unknown as ClassGroupWithMixins;
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const numericIds: number[] = studentIds
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n));
      if (numericIds.length > 0) {
        // numericIds validated above; suppress linter false-positive

        await group.$set?.('students', numericIds);
      }
    }
    return this.findOne(group.id);
  }

  async findAll(): Promise<ClassGroupWithMixins[]> {
    return (await this.classGroupModel.findAll({
      include: [Lesson, Student],
    })) as unknown as ClassGroupWithMixins[];
  }

  async findOne(id: number): Promise<ClassGroupWithMixins | null> {
    return (await this.classGroupModel.findByPk(id, {
      include: [Lesson, Student],
    })) as unknown as ClassGroupWithMixins | null;
  }

  async update(
    id: number,
    data: Partial<ClassGroup>,
  ): Promise<ClassGroup | null> {
    const group = await this.findOne(id);
    if (!group) return null;
    const { studentIds, ...payload } = data as Partial<ClassGroup> & {
      studentIds?: number[];
    };
    await group.update(payload as Partial<ClassGroup>);
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const numericIds: number[] = studentIds
        .map((v) => Number(v))
        .filter((n) => Number.isInteger(n));
      if (numericIds.length > 0) {
        // numericIds validated above; suppress linter false-positive

        await group.$set?.('students', numericIds);
      }
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
