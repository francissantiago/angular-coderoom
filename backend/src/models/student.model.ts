import { Table, Column, Model, HasMany, DataType } from 'sequelize-typescript';
import { Certificate } from './certificate.model';

@Table({ tableName: 'students', timestamps: true })
export class Student extends Model {
  @Column
  declare name: string;

  @Column({ unique: true })
  declare email: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare enrollmentNumber: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare birthDate: string | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare password?: string | null;

  @HasMany(() => Certificate)
  declare certificates: Certificate[];
}