import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Lesson } from '../models/lesson.model';

@Injectable()
export class LessonService {
  constructor(@InjectModel(Lesson) private lessonModel: typeof Lesson) {}

  async create(data: Partial<Lesson>): Promise<Lesson> {
    return this.lessonModel.create(data as any);
  }

  async findAll(): Promise<Lesson[]> {
    return this.lessonModel.findAll();
  }

  async findOne(id: number): Promise<Lesson | null> {
    return this.lessonModel.findByPk(id);
  }

  async update(id: number, data: Partial<Lesson>): Promise<Lesson | null> {
    const lesson = await this.findOne(id);
    if (!lesson) return null;
    return lesson.update(data as any);
  }

  async remove(id: number): Promise<boolean> {
    const lesson = await this.findOne(id);
    if (!lesson) return false;
    await lesson.destroy();
    return true;
  }
}
