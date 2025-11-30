import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Project } from '../models/project.model';

@Injectable()
export class ProjectService {
  constructor(@InjectModel(Project) private projectModel: typeof Project) {}

  async create(data: Partial<Project>): Promise<Project> {
    const payload = data;
    return this.projectModel.create(payload);
  }

  async findAll(): Promise<Project[]> {
    return this.projectModel.findAll();
  }

  async findOne(id: number): Promise<Project | null> {
    return this.projectModel.findByPk(id);
  }

  async update(id: number, data: Partial<Project>): Promise<Project | null> {
    const project = await this.findOne(id);
    if (!project) return null;
    return project.update(data);
  }

  async remove(id: number): Promise<boolean> {
    const project = await this.findOne(id);
    if (!project) return false;
    await project.destroy();
    return true;
  }
}
