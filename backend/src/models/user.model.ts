import { Table, Column, Model } from 'sequelize-typescript';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @Column
  name: string;

  @Column({ unique: true })
  email: string;

  @Column
  role: 'student' | 'teacher';

  @Column
  password: string;
}