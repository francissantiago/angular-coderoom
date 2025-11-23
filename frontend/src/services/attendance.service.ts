
import { Injectable, signal, inject } from '@angular/core';
import { ClassSession } from '../models/domain.models';
import { HttpClient } from '@angular/common/http';

// Sessions are loaded from the API via HTTP; mock data removed.

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';
  // We now store Sessions, which contain attendance AND content info
  sessions = signal<ClassSession[]>([]);

  constructor() {
    this.loadSessions();
  }

  async loadSessions() {
    try {
      const list = await this.http.get<ClassSession[]>(`${this.baseUrl}/class-sessions`).toPromise();
      this.sessions.set(list || []);
    } catch (error) {
      console.error('Failed to load sessions', error);
      this.sessions.set([]);
    }
  }

  async registerSession(data: Omit<ClassSession, 'id'>) {
    try {
      const created = await this.http.post<ClassSession>(`${this.baseUrl}/class-sessions`, data).toPromise();
      this.sessions.update(s => [...s, created]);
      return created;
    } catch (error) {
      console.error('Failed to create session', error);
      throw error;
    }
  }

  getSessionsByClass(classId: number): ClassSession[] {
    return this.sessions().filter(s => s.classId === classId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getSessionsByLesson(classId: number, lessonId: number): ClassSession[] {
    return this.sessions().filter(s => s.classId === classId && s.lessonId === lessonId);
  }

  async removeStudentFromAttendance(studentId: number) {
    this.sessions.update(sessions => sessions.map(s => ({ ...s, presentStudentIds: s.presentStudentIds.filter(id => id !== studentId) })));
    try {
      // Persist changes to server: update each modified session
      const modified = this.sessions().filter(s => !s.presentStudentIds.includes(studentId));
      for (const ms of modified) {
        await this.http.put(`${this.baseUrl}/class-sessions/${ms.id}`, ms).toPromise();
      }
    } catch (error) {
      console.error('Failed to persist session updates', error);
    }
  }

  // Calculate frequency based on ALL sessions given to that class
  getStudentAttendancePercentage(studentId: number, classId: number): number {
      const classSessions = this.sessions().filter(s => s.classId === classId);
      if (classSessions.length === 0) return 100; // No classes given yet

      const presentCount = classSessions.filter(s => s.presentStudentIds.includes(studentId)).length;
      return Math.round((presentCount / classSessions.length) * 100);
  }
}
