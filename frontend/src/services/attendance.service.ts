
import { Injectable, signal, inject } from '@angular/core';
import { ClassSession } from '../models/domain.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, retry, timer, tap, catchError, of, forkJoin, map } from 'rxjs';
import { HandleErrors } from './handle-errors.service';
import { AuthManager } from './auth-manager.service';

// Sessions are loaded from the API via HTTP; mock data removed.

@Injectable({
  providedIn: 'root',
})
export class AttendanceService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private headers = inject(AuthManager).headers;
  private api_retry_count = environment.apiMaxRetries || 3;
  private handlerErrors = inject(HandleErrors);
  // We now store Sessions, which contain attendance AND content info
  sessions = signal<ClassSession[]>([]);

  constructor() {
    this.loadSessions();
  }

  loadSessions() {
    // Fetch sessions and attendances and combine so frontend prefers normalized attendances
    this.getAllWithAttendances().subscribe({
      next: (list) => this.sessions.set(list || []),
      error: (err) => {
        console.error('Failed to load sessions or attendances', err);
        this.sessions.set([]);
      },
    });
  }

  // Fetch sessions and attendances and merge presentStudentIds from attendances
  getAllWithAttendances(): Observable<ClassSession[]> {
    const sessions$ = this.http.get<ClassSession[]>(`${this.apiUrl}/class-sessions`, { headers: this.headers });
    const attendances$ = this.http.get<any[]>(`${this.apiUrl}/attendances`, { headers: this.headers }).pipe(
      catchError((err) => {
        // If attendances endpoint fails, continue with empty array so sessions still load
        console.warn('Failed to load attendances, continuing with sessions only', err);
        return of([] as any[]);
      })
    );

    return forkJoin([sessions$, attendances$]).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de recuperar sessões devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      // Merge attendances into sessions
      tap(([sessions, attendances]) => {
        const map = new Map<number, number[]>();
        (attendances || []).forEach((a: any) => {
          const sid = a.class_session_id ?? a.classSessionId ?? a.classSessionID ?? a.classSessionId;
          const studentId = a.student_id ?? a.studentId ?? a.studentID ?? a.studentId;
          if (!sid || !studentId) return;
          const arr = map.get(Number(sid)) ?? [];
          arr.push(Number(studentId));
          map.set(Number(sid), arr);
        });

        // mutate sessions array to include presentStudentIds from attendances map
        sessions.forEach((s: any) => {
          const sid = s.id ?? s.ID ?? s.sessionId;
          s.presentStudentIds = map.get(Number(sid)) ?? s.presentStudentIds ?? [];
        });
      }),
      // return only sessions to caller
      catchError(this.handlerErrors.handleError),
      // map to first element only (sessions)
      // forkJoin result [sessions, attendances] -> map to sessions
      map(([sessions, _attendances]) => sessions as ClassSession[])
    );
  }

  registerSession(data: Omit<ClassSession, 'id'>): Observable<ClassSession> {
    return this.http.post<ClassSession>(`${this.apiUrl}/class-sessions`, data, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de criar sessão devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((created) => this.sessions.update((s) => [...s, created])),
      catchError(this.handlerErrors.handleError)
    );
  }

  getSessionsByClass(classId: number): ClassSession[] {
    return this.sessions().filter(s => s.classId === classId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getSessionsByLesson(classId: number, lessonId: number): ClassSession[] {
    return this.sessions().filter(s => s.classId === classId && s.lessonId === lessonId);
  }

  removeStudentFromAttendance(studentId: number): Observable<any> {
    // Determine modified sessions and update signal
    this.sessions.update((sessions) =>
      sessions.map((s) => ({ ...s, presentStudentIds: s.presentStudentIds.filter((id) => id !== studentId) }))
    );

    const modified = this.sessions().filter((s) => !s.presentStudentIds.includes(studentId));
    if (modified.length === 0) return of(null);

    // Persist changes (parallel) and return completion as Observable using forkJoin
    const observables = modified.map((ms) =>
      this.http.put(`${this.apiUrl}/class-sessions/${ms.id}`, ms, { headers: this.headers }).pipe(
        catchError((err) => {
          console.error('Failed to persist session update for', ms.id, err);
          return of(null);
        })
      )
    );

    return forkJoin(observables).pipe(catchError(this.handlerErrors.handleError));
  }

  /**
   * Salva (insere ou atualiza) o registro de presença para uma data específica.
   * Retorna o `Observable` que completa quando a persistência terminar.
   */
  saveAttendance(classId: number, date: string, presentStudentIds: number[]): Observable<ClassSession> {
    const existing = this.getSessionsByClass(classId).find(s => s.date === date);

    if (existing) {
      const updated: ClassSession = { ...existing, presentStudentIds };
      return this.http.put<ClassSession>(`${this.apiUrl}/class-sessions/${existing.id}`, updated, { headers: this.headers }).pipe(
        retry({
          count: this.api_retry_count,
          delay: (error, retryCount) => {
            if (error.status < 500) throw error;
            console.warn(`Tentativa ${retryCount} de atualizar presença devido a erro:`, error);
            return timer(retryCount * 2000);
          },
        }),
        tap((saved) => {
          // Atualiza o sinal com a sessão modificada
          this.sessions.update((s) => s.map((x) => (x.id === saved.id ? saved : x)));
        }),
        catchError(this.handlerErrors.handleError)
      );
    }

    // Não existe sessão para a data: criar nova
    const payload: Omit<ClassSession, 'id'> = {
      classId,
      date,
      lessonId: null,
      presentStudentIds,
    };

    return this.registerSession(payload).pipe(catchError(this.handlerErrors.handleError));
  }

  // Calculate frequency based on ALL sessions given to that class
  getStudentAttendancePercentage(studentId: number, classId: number): number {
      const classSessions = this.sessions().filter(s => s.classId === classId);
      if (classSessions.length === 0) return 100; // No classes given yet

      const presentCount = classSessions.filter(s => s.presentStudentIds.includes(studentId)).length;
      return Math.round((presentCount / classSessions.length) * 100);
  }
}
