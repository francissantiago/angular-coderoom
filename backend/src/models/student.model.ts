import { Table, Column, Model } from 'sequelize-typescript';

@Table({ tableName: 'students', timestamps: true })
export class Student extends Model {
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