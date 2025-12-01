import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Attendance } from '../models/attendance.model';

@Injectable()
export class AttendanceService {
  constructor(@InjectModel(Attendance) private attendanceModel: typeof Attendance) {}

  async findAll(filter?: { classSessionId?: number }) {
    const where: any = {};
    if (filter?.classSessionId != null) where.classSessionId = filter.classSessionId;
    return this.attendanceModel.findAll({ where });
  }
}
