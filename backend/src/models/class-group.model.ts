import {
  Table,
  Column,
  Model,
  HasMany,
  BelongsToMany,
} from 'sequelize-typescript';
import { Project } from './project.model';
import { ClassSession } from './class-session.model';
import { Lesson } from './lesson.model';
import { Student } from './student.model';

// through model/table name: class_group_students

@Table({ tableName: 'class_groups', timestamps: true })
export class ClassGroup extends Model {
  @Column
  declare name: string;

  @Column
  declare description: string;

  @Column
  declare schedule: string;

  @HasMany(() => Lesson, { foreignKey: 'class_group_id' })
  declare lessons: Lesson[];

  @BelongsToMany(
    () => Student,
    'class_group_students',
    'class_group_id',
    'student_id',
  )
  declare students: Student[];

  @HasMany(() => Project)
  declare projects: Project[];

  @HasMany(() => ClassSession)
  declare sessions: ClassSession[];
}

// Keep a simple alias for places that previously referenced mixins.
export type ClassGroupWithMixins = ClassGroup;
