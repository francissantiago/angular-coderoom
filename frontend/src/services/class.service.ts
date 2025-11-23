
import { Injectable, signal, inject } from '@angular/core';
import { ClassGroup, Lesson } from '../models/domain.models';
import { HttpClient } from '@angular/common/http';

// Class groups are loaded from the API via HTTP; mock data removed.

@Injectable({
  providedIn: 'root',
})
export class ClassService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';
  classGroups = signal<ClassGroup[]>([]);

  constructor() {
    this.loadClassGroups();
  }

  async loadClassGroups() {
    try {
      const list = await this.http.get<ClassGroup[]>(`${this.baseUrl}/class-groups`).toPromise();
      this.classGroups.set(list || []);
    } catch (error) {
      console.error('Failed to load class groups', error);
      this.classGroups.set([]);
    }
  }

  async addNewClassGroup(name: string, description: string, schedule: string, studentIds: number[]) {
    try {
      const payload = { name, description, schedule, studentIds };
      const created = await this.http.post<ClassGroup>(`${this.baseUrl}/class-groups`, payload).toPromise();
      this.classGroups.update(list => [...list, created]);
      return created;
    } catch (error) {
      console.error('Failed to create class group', error);
      throw error;
    }
  }

  async updateClassGroup(classId: number, name: string, description: string, schedule: string, studentIds: number[]) {
    const group = this.classGroups().find(g => g.id === classId);
    if (!group) return null;
    const updated = { ...group, name, description, schedule, studentIds } as ClassGroup;
    try {
      const resp = await this.http.put<ClassGroup>(`${this.baseUrl}/class-groups/${classId}`, updated).toPromise();
      this.classGroups.update(groups => groups.map(g => g.id === classId ? resp : g));
      return resp;
    } catch (error) {
      console.error('Failed to update class group', error);
      return null;
    }
  }

  async removeStudentFromClasses(studentId: number) {
    // Update locally and attempt to persist
    this.classGroups.update(groups =>
      groups.map(g => ({ ...g, studentIds: g.studentIds.filter(id => id !== studentId) }))
    );
    try {
      // Persist all affected groups
      const affected = this.classGroups().filter(g => g.studentIds.includes(studentId) === false);
      for (const g of affected) {
        await this.http.put(`${this.baseUrl}/class-groups/${g.id}`, g).toPromise();
      }
    } catch (error) {
      console.error('Failed to persist class group updates on student removal', error);
    }
  }

  addLessonToClass(classId: number, lessonData: Omit<Lesson, 'id'>) {
    this.classGroups.update(groups => groups.map(g => {
      if (g.id === classId) {
        const nextId = g.lessons.length > 0 ? Math.max(...g.lessons.map(m => m.id)) + 1 : 1;
        const newLesson: Lesson = { ...lessonData, id: nextId };
        const updated = { ...g, lessons: [...g.lessons, newLesson] };
        this.http.put(`${this.baseUrl}/class-groups/${classId}`, updated).toPromise().catch(err => console.error('Failed to persist lesson add', err));
        return updated;
      }
      return g;
    }));
  }

  updateLessonInClass(classId: number, lesson: Lesson) {
    this.classGroups.update(groups => groups.map(g => {
      if (g.id === classId) {
        const updated = { ...g, lessons: g.lessons.map(m => m.id === lesson.id ? lesson : m) };
        this.http.put(`${this.baseUrl}/class-groups/${classId}`, updated).toPromise().catch(err => console.error('Failed to persist lesson update', err));
        return updated;
      }
      return g;
    }));
  }

  removeLessonFromClass(classId: number, lessonId: number) {
    this.classGroups.update(groups => groups.map(g => {
      if (g.id === classId) {
        const updated = { ...g, lessons: g.lessons.filter(m => m.id !== lessonId) };
        this.http.put(`${this.baseUrl}/class-groups/${classId}`, updated).toPromise().catch(err => console.error('Failed to persist lesson delete', err));
        return updated;
      }
      return g;
    }));
  }
}
