import { Table, Column, Model, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Column({ unique: true })
  email: string;

  @Column
  role: 'student' | 'teacher';

  @Column
  password: string;
}