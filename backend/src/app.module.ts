import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { ClassGroupModule } from './class-group/class-group.module';
import { ProjectModule } from './project/project.module';
import { LessonModule } from './lesson/lesson.module';
import { ClassSessionModule } from './class-session/class-session.module';
import { CertificateModule } from './certificate/certificate.module';
import { User } from './models/user.model';
import { Student } from './models/student.model';
import { Project } from './models/project.model';
import { Lesson } from './models/lesson.model';
import { ClassSession } from './models/class-session.model';
import { ClassGroup } from './models/class-group.model';
import { Certificate } from './models/certificate.model';
import { Attendance } from './models/attendance.model';
import { AttendanceModule } from './attendance/attendance.module';
import { SeederService } from './seed/seeder.service';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'user',
      password: 'password',
      database: 'coderoom_db',
      autoLoadModels: true,
      synchronize: true,
      models: [
        User,
        Student,
        Project,
        Lesson,
        ClassSession,
        ClassGroup,
        Certificate,
        Attendance,
      ],
    }),
    SequelizeModule.forFeature([User]),
    AuthModule,
    StudentsModule,
    ClassGroupModule,
    ProjectModule,
    LessonModule,
    ClassSessionModule,
    CertificateModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeederService],
})
export class AppModule {}
