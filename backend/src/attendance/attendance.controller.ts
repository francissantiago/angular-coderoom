import { Controller, Get, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { Attendance } from '../models/attendance.model';

@Controller('attendances')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get()
  async findAll(@Query('classSessionId') classSessionId?: string): Promise<Attendance[]> {
    const filter = classSessionId ? { classSessionId: Number(classSessionId) } : undefined;
    return this.service.findAll(filter);
  }
}
