import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClassSession } from '../models/class-session.model';
import { Lesson } from '../models/lesson.model';
import { ClassGroup } from '../models/class-group.model';
import { Attendance } from '../models/attendance.model';

@Injectable()
export class ClassSessionService {
  constructor(
    @InjectModel(ClassSession) private model: typeof ClassSession,
    @InjectModel(Lesson) private lessonModel: typeof Lesson,
    @InjectModel(ClassGroup) private classGroupModel: typeof ClassGroup,
    @InjectModel(Attendance) private attendanceModel: typeof Attendance,
  ) {}

  async create(
    data: Partial<ClassSession> & {
      classGroupId?: number;
      classId?: number;
      lessonId?: number;
      lesson_id?: number;
    },
  ): Promise<ClassSession> {
    // Validate foreign keys before attempting DB insert to provide clearer errors
    // support both old (classId/lessonId) and new (classGroupId/lesson_id) keys
    const classGroupId = data.classGroupId ?? data.classId;
    if (classGroupId == null) {
      throw new BadRequestException('classGroupId (or classId) is required');
    }

    const cls = await this.classGroupModel.findByPk(classGroupId);
    if (!cls) {
      throw new BadRequestException(
        `ClassGroup with id=${classGroupId} not found`,
      );
    }

    const lessonId = data.lessonId ?? data.lesson_id;
    if (lessonId != null) {
      const lesson = await this.lessonModel.findByPk(lessonId);
      if (!lesson) {
        throw new BadRequestException(`Lesson with id=${lessonId} not found`);
      }
    }

    const payload = {
      ...(data as Partial<ClassSession>),
    } as Partial<ClassSession>;
    // ensure we pass the new attribute name to the model
    payload.classGroupId = classGroupId;
    // remove legacy key if present to avoid unknown column errors
    delete (payload as unknown as Record<string, unknown>).classId;

    const created = await this.model.create(payload as any);
    // If presentStudentIds were provided in payload, sync attendances table
    const present = (payload as any).presentStudentIds ?? (payload as any).present_student_ids ?? null;
    if (Array.isArray(present)) {
      await this.syncAttendances(created.id, present as number[]);
    }
    return await this.mapSession(created);
  }

  async findAll(): Promise<ClassSession[]> {
    const rows = await this.model.findAll();
    const mapped = await Promise.all(rows.map((r) => this.mapSession(r)));
    return mapped as unknown as ClassSession[];
  }

  async findOne(id: number): Promise<ClassSession | null> {
    const row = await this.model.findByPk(id);
    if (!row) return null;
    return (await this.mapSession(row)) as unknown as ClassSession;
  }

  async update(
    id: number,
    data: Partial<ClassSession>,
  ): Promise<ClassSession | null> {
    const csModel = await this.model.findByPk(id);
    if (!csModel) return null;
    await csModel.update(data as any);
    // If client provided presentStudentIds in the update payload, synchronize attendances
    const present = (data as any).presentStudentIds ?? (data as any).present_student_ids ?? null;
    if (Array.isArray(present)) {
      await this.syncAttendances(csModel.id as number, present as number[]);
    }
    return (await this.mapSession(csModel)) as unknown as ClassSession;
  }

  async remove(id: number): Promise<boolean> {
    const cs = await this.findOne(id);
    if (!cs) return false;
    // cs here may be a plain object after mapping; use model instance to destroy
    const modelInstance = await this.model.findByPk(id);
    if (!modelInstance) return false;
    await modelInstance.destroy();
    return true;
  }

  // Replace attendances for a session to match provided presentStudentIds
  private async syncAttendances(sessionId: number, presentStudentIds: number[]) {
    // remove existing attendances for this session
    await this.attendanceModel.destroy({ where: { classSessionId: sessionId } });

    if (!presentStudentIds || presentStudentIds.length === 0) return;

    const rows = presentStudentIds.map((studentId) => ({
      classSessionId: sessionId,
      studentId,
      status: 'present',
    }));

    await this.attendanceModel.bulkCreate(rows as any[]);
  }

  // Normalize model instance into shape expected by frontend
  private async mapSession(row: InstanceType<typeof ClassSession> | ClassSession): Promise<any> {
    const raw = (row as any).toJSON ? (row as any).toJSON() : row;
    // Normalize snake_case -> camelCase keys expected by frontend
    const normalized: any = { ...raw };
    // classId expected by frontend (legacy key)
    normalized.classId = raw.class_group_id ?? raw.classGroupId ?? raw.classId ?? null;
    // lessonId
    normalized.lessonId = raw.lesson_id ?? raw.lessonId ?? null;
    // presentStudentIds may be stored as present_student_ids or presentStudentIds
    let present = raw.present_student_ids ?? raw.presentStudentIds ?? null;
    if (!Array.isArray(present)) {
      // Try to load from attendances table if available
      try {
        const sessionId = raw.id ?? raw.ID ?? null;
        if (sessionId != null) {
          const rows = await this.attendanceModel.findAll({ where: { classSessionId: sessionId } });
          present = rows.map((r: any) => r.studentId ?? r.student_id).filter(Boolean);
        } else {
          present = [];
        }
      } catch (err) {
        present = [];
      }
    }
    normalized.presentStudentIds = present || [];
    return normalized;
  }
}
