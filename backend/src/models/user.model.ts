import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'users', timestamps: true })
export class User extends Model {
  @Column
  declare name: string;

  @Column({ unique: true })
  declare email: string;

  @Column
  declare role: 'student' | 'teacher';

  @Column({ type: DataType.STRING, allowNull: true })
  declare password: string | null;
}