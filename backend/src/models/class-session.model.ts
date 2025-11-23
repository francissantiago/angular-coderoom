import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { ClassGroup } from './class-group.model';
import { Lesson } from './lesson.model';

@Table({ tableName: 'class_sessions', timestamps: true })
export class ClassSession extends Model {
  @Column({ type: DataType.STRING })
  declare date: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare observation?: string | null;

  @Column({ type: DataType.JSON, allowNull: true })
  declare presentStudentIds: number[] | null;

  @ForeignKey(() => ClassGroup)
  @Column
  declare classId: number;

  @BelongsTo(() => ClassGroup)
  declare classGroup: ClassGroup;

  @ForeignKey(() => Lesson)
  @Column
  declare lessonId: number;

  @BelongsTo(() => Lesson)
  declare lesson: Lesson;
}