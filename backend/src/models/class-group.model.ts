import { Table, Column, Model, HasMany, DataType } from 'sequelize-typescript';
import { Project } from './project.model';
import { ClassSession } from './class-session.model';
import { Lesson } from './lesson.model';

@Table({ tableName: 'class_groups', timestamps: true })
export class ClassGroup extends Model {
  @Column
  declare name: string;

  @Column
  declare description: string;

  @Column
  declare schedule: string;

  @Column({ type: DataType.JSON, allowNull: true })
  declare studentIds: number[] | null;

  @Column({ type: DataType.JSON, allowNull: true })
  declare lessons: Lesson[] | null;

  @HasMany(() => Project)
  declare projects: Project[];

  @HasMany(() => ClassSession)
  declare sessions: ClassSession[];
}