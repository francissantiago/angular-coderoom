
import { Injectable, signal } from '@angular/core';
import { ClassSession } from '../models/domain.models';

const MOCK_SESSIONS: ClassSession[] = [
  // Turma 101 took 3 sessions to finish Lesson 1
  { id: 1, classId: 1, date: '2023-10-07', lessonId: 1, presentStudentIds: [1, 3], observation: 'Introdução parte 1' },
  { id: 2, classId: 1, date: '2023-10-14', lessonId: 1, presentStudentIds: [1], observation: 'Introdução parte 2 - Peter ausente' },
  { id: 3, classId: 1, date: '2023-10-21', lessonId: 1, presentStudentIds: [1, 3], observation: 'Introdução parte 3 - Conclusão' },
  
  // Turma 102 finished Lesson 1 in 1 session
  { id: 4, classId: 2, date: '2023-10-02', lessonId: 1, presentStudentIds: [2, 4], observation: 'Turma com ritmo rápido.' },
];

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  // We now store Sessions, which contain attendance AND content info
  sessions = signal<ClassSession[]>(MOCK_SESSIONS);

  registerSession(data: Omit<ClassSession, 'id'>) {
    this.sessions.update(sessions => {
      const newId = sessions.length > 0 ? Math.max(...sessions.map(s => s.id)) + 1 : 1;
      return [...sessions, { id: newId, ...data }];
    });
  }

  getSessionsByClass(classId: number): ClassSession[] {
    return this.sessions().filter(s => s.classId === classId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getSessionsByLesson(classId: number, lessonId: number): ClassSession[] {
    return this.sessions().filter(s => s.classId === classId && s.lessonId === lessonId);
  }

  removeStudentFromAttendance(studentId: number) {
    this.sessions.update(sessions => 
      sessions.map(s => ({
          ...s,
          presentStudentIds: s.presentStudentIds.filter(id => id !== studentId)
      }))
    );
  }

  // Calculate frequency based on ALL sessions given to that class
  getStudentAttendancePercentage(studentId: number, classId: number): number {
      const classSessions = this.sessions().filter(s => s.classId === classId);
      if (classSessions.length === 0) return 100; // No classes given yet

      const presentCount = classSessions.filter(s => s.presentStudentIds.includes(studentId)).length;
      return Math.round((presentCount / classSessions.length) * 100);
  }
}
