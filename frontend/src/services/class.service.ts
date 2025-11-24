
import { Injectable, signal, inject } from '@angular/core';
import { ClassGroup, Lesson } from '../models/domain.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, retry, timer, tap, catchError, of, forkJoin } from 'rxjs';
import { HandleErrors } from './handle-errors.service';
import { AuthManager } from './auth-manager.service';

// Class groups are loaded from the API via HTTP; mock data removed.

@Injectable({
  providedIn: 'root',
})
export class ClassService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private headers = inject(AuthManager).headers;
  private api_retry_count = environment.apiMaxRetries || 3;
  private handlerErrors = inject(HandleErrors);
  classGroups = signal<ClassGroup[]>([]);

  constructor() {
    this.loadClassGroups();
  }

  loadClassGroups() {
    this.getAll().subscribe({
      next: (list) => this.classGroups.set(list || []),
      error: (err) => {
        console.error('Failed to load class groups', err);
        this.classGroups.set([]);
      },
    });
  }

  getAll(): Observable<ClassGroup[]> {
    return this.http.get<ClassGroup[]>(`${this.apiUrl}/class-groups`, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de recuperar turmas devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      catchError(this.handlerErrors.handleError)
    );
  }

  addNewClassGroup(name: string, description: string, schedule: string, studentIds: number[]): Observable<ClassGroup> {
    const payload = { name, description, schedule, studentIds };
    return this.http.post<ClassGroup>(`${this.apiUrl}/class-groups`, payload, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de criar turma devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((created) => this.classGroups.update((list) => [...list, created])),
      catchError(this.handlerErrors.handleError)
    );
  }

  updateClassGroup(classId: number, name: string, description: string, schedule: string, studentIds: number[]): Observable<ClassGroup | null> {
    const group = this.classGroups().find((g) => g.id === classId);
    if (!group) return of(null);
    const updated = { ...group, name, description, schedule, studentIds } as ClassGroup;
    return this.http.put<ClassGroup>(`${this.apiUrl}/class-groups/${classId}`, updated, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de atualizar turma ${classId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((resp) => this.classGroups.update((groups) => groups.map((g) => (g.id === classId ? resp : g)))),
      catchError(this.handlerErrors.handleError)
    );
  }

  removeStudentFromClasses(studentId: number): Observable<any> {
    this.classGroups.update((groups) => groups.map((g) => ({ ...g, studentIds: g.studentIds.filter((id) => id !== studentId) })));
    const affected = this.classGroups().filter((g) => g.studentIds.includes(studentId) === false);
    if (affected.length === 0) return of(null);
    const observables = affected.map((g) => this.http.put(`${this.apiUrl}/class-groups/${g.id}`, g, { headers: this.headers }).pipe(catchError((err) => {
      console.error('Failed to persist class group update', err);
      return of(null);
    })));
    return forkJoin(observables).pipe(catchError(this.handlerErrors.handleError));
  }

  addLessonToClass(classId: number, lessonData: Omit<Lesson, 'id'>): Observable<ClassGroup | undefined> {
    const current = this.classGroups();
    const updatedGroups = current.map((g) => {
      if (g.id === classId) {
        const nextId = g.lessons.length > 0 ? Math.max(...g.lessons.map((m) => m.id)) + 1 : 1;
        const newLesson: Lesson = { ...lessonData, id: nextId };
        return { ...g, lessons: [...g.lessons, newLesson] };
      }
      return g;
    });
    this.classGroups.set(updatedGroups);
    const updated = updatedGroups.find((g) => g.id === classId);
    if (!updated) return of(undefined);
    return this.http.put<ClassGroup>(`${this.apiUrl}/class-groups/${classId}`, updated, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de salvar aula na turma ${classId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((resp) => this.classGroups.update((groups) => groups.map((g) => (g.id === resp.id ? resp : g)))),
      catchError(this.handlerErrors.handleError)
    );
  }

  updateLessonInClass(classId: number, lesson: Lesson): Observable<ClassGroup | undefined> {
    const current = this.classGroups();
    const updatedGroups = current.map((g) => {
      if (g.id === classId) {
        return { ...g, lessons: g.lessons.map((m) => (m.id === lesson.id ? lesson : m)) };
      }
      return g;
    });
    this.classGroups.set(updatedGroups);
    const updated = updatedGroups.find((g) => g.id === classId);
    if (!updated) return of(undefined);
    return this.http.put<ClassGroup>(`${this.apiUrl}/class-groups/${classId}`, updated, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de atualizar aula ${lesson.id} na turma ${classId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((resp) => this.classGroups.update((groups) => groups.map((g) => (g.id === resp.id ? resp : g)))),
      catchError(this.handlerErrors.handleError)
    );
  }

  removeLessonFromClass(classId: number, lessonId: number): Observable<ClassGroup | undefined> {
    const current = this.classGroups();
    const updatedGroups = current.map((g) => {
      if (g.id === classId) {
        return { ...g, lessons: g.lessons.filter((m) => m.id !== lessonId) };
      }
      return g;
    });
    this.classGroups.set(updatedGroups);
    const updated = updatedGroups.find((g) => g.id === classId);
    if (!updated) return of(undefined);
    return this.http.put<ClassGroup>(`${this.apiUrl}/class-groups/${classId}`, updated, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de deletar aula ${lessonId} na turma ${classId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((resp) => this.classGroups.update((groups) => groups.map((g) => (g.id === resp.id ? resp : g)))),
      catchError(this.handlerErrors.handleError)
    );
  }
}
