import {
  Table,
  Column,
  Model,
  ForeignKey,
  BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { ClassGroup } from './class-group.model';

@Table({ tableName: 'lessons', timestamps: true })
export class Lesson extends Model {
  @Column
  title: string;

  @Column
  description: string;

  @Column
  standardDuration: number;

  @ForeignKey(() => ClassGroup)
  @Column({ field: 'class_group_id', type: DataType.BIGINT, allowNull: true })
  classGroupId?: number | null;

  @BelongsTo(() => ClassGroup)
  classGroup?: ClassGroup;
}
