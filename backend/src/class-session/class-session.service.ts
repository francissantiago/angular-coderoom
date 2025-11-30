import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassSession } from '../models/class-session.model';
import { Lesson } from '../models/lesson.model';
import { ClassGroup } from '../models/class-group.model';

@Injectable()
export class ClassSessionService {
  constructor(
    @InjectModel(ClassSession) private model: typeof ClassSession,
    @InjectModel(Lesson) private lessonModel: typeof Lesson,
    @InjectModel(ClassGroup) private classGroupModel: typeof ClassGroup,
  ) {}

  async create(data: Partial<ClassSession>): Promise<ClassSession> {
    // Validate foreign keys before attempting DB insert to provide clearer errors
    const payload: any = { ...(data as any) };

    // support both old (classId/lessonId) and new (classGroupId/lessonId) keys
    const classGroupId = payload.classGroupId ?? payload.classId;
    if (classGroupId == null) {
      throw new BadRequestException('classGroupId (or classId) is required');
    }

    const cls = await this.classGroupModel.findByPk(classGroupId);
    if (!cls) {
      throw new BadRequestException(
        `ClassGroup with id=${classGroupId} not found`,
      );
    }

    const lessonId = payload.lessonId ?? payload.lesson_id;
    if (lessonId != null) {
      const lesson = await this.lessonModel.findByPk(lessonId);
      if (!lesson) {
        throw new BadRequestException(`Lesson with id=${lessonId} not found`);
      }
    }

    // ensure we pass the new attribute name to the model
    payload.classGroupId = classGroupId;
    delete payload.classId;

    return this.model.create(payload);
  }

  async findAll(): Promise<ClassSession[]> {
    return this.model.findAll();
  }

  async findOne(id: number): Promise<ClassSession | null> {
    return this.model.findByPk(id);
  }

  async update(
    id: number,
    data: Partial<ClassSession>,
  ): Promise<ClassSession | null> {
    const cs = await this.findOne(id);
    if (!cs) return null;
    return cs.update(data as any);
  }

  async remove(id: number): Promise<boolean> {
    const cs = await this.findOne(id);
    if (!cs) return false;
    await cs.destroy();
    return true;
  }
}
