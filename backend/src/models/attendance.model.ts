import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { ClassSession } from './class-session.model';
import { Student } from './student.model';

@Table({ tableName: 'attendances', timestamps: true })
export class Attendance extends Model {
  @ForeignKey(() => ClassSession)
  @Column({ field: 'class_session_id', type: DataType.INTEGER, allowNull: false })
  declare classSessionId: number;

  @ForeignKey(() => Student)
  @Column({ field: 'student_id', type: DataType.INTEGER, allowNull: false })
  declare studentId: number;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'present' })
  declare status: string;

  @BelongsTo(() => ClassSession)
  declare session: ClassSession;

  @BelongsTo(() => Student)
  declare student: Student;
}
