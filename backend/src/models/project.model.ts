import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { ClassGroup } from './class-group.model';

export interface CodeState {
  html: string;
  css: string;
  js: string;
}

export interface StudentSubmission {
  studentId: number;
  studentName: string;
  code: CodeState;
  lastSaved: Date | null;
  grade?: number;
  feedback?: string;
}

@Table({ tableName: 'projects', timestamps: true })
export class Project extends Model {
  @Column
  declare name: string;

  @Column
  declare description: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare teacherCode: CodeState | null;

  @Column({ type: DataType.JSON, allowNull: true })
  declare studentSubmissions: StudentSubmission[] | null;

  @ForeignKey(() => ClassGroup)
  @Column({ field: 'class_group_id', type: DataType.INTEGER, allowNull: true })
  declare classId?: number | null;

  @BelongsTo(() => ClassGroup)
  declare classGroup: ClassGroup;
}
