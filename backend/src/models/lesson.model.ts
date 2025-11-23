import { Table, Column, Model } from 'sequelize-typescript';

@Table({ tableName: 'lessons', timestamps: true })
export class Lesson extends Model {
  @Column
  title: string;

  @Column
  description: string;

  @Column
  standardDuration: number;
}