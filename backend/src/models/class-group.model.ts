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

  // Sequelize association mixins (typed locally to avoid `any` usage elsewhere)
  // these are used by service code to manage relations (e.g. `$set('students', ids)`)
  $set?: (key: string, ids: number[]) => Promise<void>;
  $add?: (key: string, ids: number[] | number) => Promise<void>;
  $remove?: (key: string, ids: number[] | number) => Promise<void>;
}

export type ClassGroupWithMixins = ClassGroup & {
  $set?: (key: string, ids: number[]) => Promise<void>;
  $add?: (key: string, ids: number[] | number) => Promise<void>;
  $remove?: (key: string, ids: number[] | number) => Promise<void>;
};
