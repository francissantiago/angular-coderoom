
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Student } from '../models/domain.models';

// Student data is loaded from the API via HTTP. Remove mocked data.

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private http = inject(HttpClient);
  students = signal<Student[]>([]);
  private baseUrl = 'http://localhost:3000';

  constructor() {
    // Load students on service init
    this.loadStudents();
  }

  async loadStudents() {
    try {
      const list = await this.http.get<Student[]>(`${this.baseUrl}/students`).toPromise();
      this.students.set(list || []);
    } catch (error) {
      console.error('Failed to load students', error);
      this.students.set([]);
    }
  }

  async addStudent(data: { name: string; email: string; enrollmentNumber: string; birthDate: string }) {
    try {
      const created = await this.http.post<Student>(`${this.baseUrl}/students`, data).toPromise();
      this.students.update(list => [...list, created]);
      return created;
    } catch (error) {
      console.error('Failed to create student', error);
      throw error;
    }
  }

  async removeStudent(studentId: number) {
    try {
      await this.http.delete(`${this.baseUrl}/students/${studentId}`).toPromise();
      this.students.update(list => list.filter(s => s.id !== studentId));
      return true;
    } catch (error) {
      console.error('Failed to remove student', error);
      return false;
    }
  }

  async getStudentById(id: number): Promise<Student | null> {
    try {
      const student = await this.http.get<Student>(`${this.baseUrl}/students/${id}`).toPromise();
      return student || null;
    } catch (error) {
      console.error('Failed to fetch student', error);
      return null;
    }
  }
}
