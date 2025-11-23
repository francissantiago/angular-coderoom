import { Table, Column, Model, ForeignKey, BelongsTo, DataType } from 'sequelize-typescript';
import { Student } from './student.model';
import { ClassGroup } from './class-group.model';

@Table({ tableName: 'certificates', timestamps: true })
export class Certificate extends Model {
  @Column({ type: DataType.STRING })
  declare issueDate: string;

  @Column({ type: DataType.STRING })
  declare validationCode: string;

  @ForeignKey(() => Student)
  @Column
  declare studentId: number;

  @BelongsTo(() => Student)
  declare student: Student;

  @ForeignKey(() => ClassGroup)
  @Column
  declare classId: number;

  @BelongsTo(() => ClassGroup)
  declare classGroup: ClassGroup;
}