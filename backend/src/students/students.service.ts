import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Student } from '../models/student.model';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student)
    private studentModel: typeof Student,
  ) {}

  async create(studentData: Partial<Student>): Promise<Student> {
    if (studentData.password) {
      studentData.password = await bcrypt.hash(studentData.password, 10);
    }
    try {
      return await this.studentModel.create(studentData);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        const field = Object.keys(error.fields)[0];
        if (field === 'email') {
          throw new BadRequestException('Email já está em uso. Por favor, use um email diferente.');
        }
        throw new BadRequestException(`O campo ${field} deve ser único.`);
      }
      throw error;
    }
  }

  async findAll(): Promise<Student[]> {
    return this.studentModel.findAll();
  }

  async findOne(id: number): Promise<Student | null> {
    return this.studentModel.findByPk(id);
  }

  async update(
    id: number,
    studentData: Partial<Student>,
  ): Promise<Student | null> {
    const student = await this.findOne(id);
    if (!student) return null;
    if (studentData.password) {
      studentData.password = await bcrypt.hash(studentData.password, 10);
    }
    return student.update(studentData);
  }

  async remove(id: number): Promise<boolean> {
    const student = await this.findOne(id);
    if (!student) return false;
    await student.destroy();
    return true;
  }
}
