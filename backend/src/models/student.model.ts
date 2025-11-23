import { Table, Column, Model, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'students', timestamps: true })
export class Student extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column({ unique: true })
  email: string;

  @Column
  enrollmentNumber: string;

  @Column
  birthDate: string;

  @Column
  password?: string;
}