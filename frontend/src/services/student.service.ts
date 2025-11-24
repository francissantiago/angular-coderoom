
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Student } from '../models/domain.models';
import { environment } from '../../environments/environment';
import { Observable, retry, timer, tap, catchError, of, map } from 'rxjs';
import { HandleErrors } from './handle-errors.service';
import { AuthManager } from './auth-manager.service';

// Student data is loaded from the API via HTTP.

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private http = inject(HttpClient);
  students = signal<Student[]>([]);
  private apiUrl = environment.apiUrl;
  private headers = inject(AuthManager).headers;
  private api_retry_count = environment.apiMaxRetries || 3;
  private handlerErrors = inject(HandleErrors);

  constructor() {
    // Load students on service init
    this.loadStudents();
  }

  loadStudents() {
    this.getAll().subscribe({
      next: (list) => this.students.set(list || []),
      error: (err) => {
        console.error('Failed to load students', err);
        this.students.set([]);
      },
    });
  }

  getAll(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/students`, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de recuperar estudantes devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      catchError(this.handlerErrors.handleError)
    );
  }

  addStudent(data: { name: string; email: string; enrollmentNumber: string; birthDate: string }): Observable<Student> {
    return this.http.post<Student>(`${this.apiUrl}/students`, data, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de criar estudante devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((created) => this.students.update((list) => [...list, created])),
      catchError(this.handlerErrors.handleError)
    );
  }

  removeStudent(studentId: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/students/${studentId}`, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de remover estudante ${studentId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap(() => this.students.update((list) => list.filter((s) => s.id !== studentId))),
      catchError((e) => {
        console.error('Failed to remove student', e);
        return of(false);
      }),
      map(() => true)
      // Convert to boolean true/false if server returned success
      // map result to boolean true where applicable can be done by the caller if necessary
    );
  }

  getStudentById(id: number): Observable<Student | null> {
    return this.http.get<Student>(`${this.apiUrl}/students/${id}`, { headers: this.headers }).pipe(catchError((err) => {
      console.error('Failed to fetch student', err);
      return of(null);
    }));
  }
}
