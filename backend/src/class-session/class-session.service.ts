import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassSession } from '../models/class-session.model';

@Injectable()
export class ClassSessionService {
  constructor(@InjectModel(ClassSession) private model: typeof ClassSession) {}

  async create(data: Partial<ClassSession>): Promise<ClassSession> {
    return this.model.create(data as any);
  }

  async findAll(): Promise<ClassSession[]> {
    return this.model.findAll();
  }

  async findOne(id: number): Promise<ClassSession | null> {
    return this.model.findByPk(id);
  }

  async update(id: number, data: Partial<ClassSession>): Promise<ClassSession | null> {
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
