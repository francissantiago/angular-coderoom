
import { Injectable, signal, inject } from '@angular/core';
import { Project, Student } from '../models/domain.models';
import { StudentService } from './student.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, retry, timer, tap, catchError, of, forkJoin, map } from 'rxjs';
import { HandleErrors } from './handle-errors.service';
import { AuthManager } from './auth-manager.service';

// Projects are loaded from the API; mock data removed.

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projects = signal<Project[]>([]);
  private studentService = inject(StudentService);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private headers = inject(AuthManager).headers;
  private api_retry_count = environment.apiMaxRetries || 3;
  private handlerErrors = inject(HandleErrors);

  constructor() {
    this.loadProjects();
  }

  loadProjects() {
    this.getAll().subscribe({
      next: (list) => this.projects.set(list || []),
      error: (err) => {
        console.error('Failed to load projects', err);
        this.projects.set([]);
      },
    });
  }

  getAll(): Observable<Project[]> {
    return this.http
      .get<Project[]>(`${this.apiUrl}/projects`, {
        headers: this.headers,
      })
      .pipe(
        retry({
          count: this.api_retry_count,
          delay: (error, retryCount) => {
            if (error.status < 500) throw error;
            console.warn(`Tentativa ${retryCount} de recuperar projetos devido a erro:`, error);
            return timer(retryCount * 2000);
          },
        }),
        catchError(this.handlerErrors.handleError)
      );
  }

  createNewProject(classId: number, name: string, description: string): Observable<Project> {
    const payload: Partial<Project> = {
      classId,
      name,
      description,
      teacherCode: { html: '<h1>Novo Projeto</h1>', css: 'body { background: #eee; }', js: "console.log('Comece aqui!');" },
      studentSubmissions: [],
    };

    return this.http.post<Project>(`${this.apiUrl}/projects`, payload, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de criar projeto devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((created) => this.projects.update((projects) => [...projects, created])),
      catchError(this.handlerErrors.handleError)
    );
  }

  updateProjectDetails(id: number, name: string, description: string): Observable<Project | null> {
    const project = this.projects().find((p) => p.id === id);
    if (!project) return of(null);
    const updated = { ...project, name, description } as Project;

    return this.http.put<Project>(`${this.apiUrl}/projects/${id}`, updated, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de atualizar projeto ${id} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((resp) => this.projects.update((projects) => projects.map((p) => (p.id === id ? resp : p)))),
      catchError(this.handlerErrors.handleError)
    );
  }

  updateProjectAssignments(projectId: number, assignedStudentIds: number[]): Observable<Project | undefined> {
    const allStudents = this.studentService.students();
    // Build new projects array synchronously
    const current = this.projects();
    const newProjects = current.map(p => {
      if (p.id !== projectId) return p;

      // Filter out submissions for unassigned students
      let updatedSubmissions = p.studentSubmissions.filter(s => assignedStudentIds.includes(s.studentId));

      // Add new submissions for newly assigned students
      assignedStudentIds.forEach(studentId => {
        const submissionExists = updatedSubmissions.some(s => s.studentId === studentId);
        if (!submissionExists) {
          const student = allStudents.find(s => s.id === studentId);
          if (student) {
            updatedSubmissions.push({
              studentId: student.id,
              studentName: student.name,
              lastSaved: null,
              code: {
                html: `<!-- Comece a codificar aqui, ${student.name}! -->\n<h1>Bem-vindo</h1>`,
                css: `/* Seu CSS vai aqui */\nbody {\n  font-family: sans-serif;\n}`,
                js: `// Seu JavaScript vai aqui\nconsole.log('Olá, ${student.name}!');`
              }
            });
          }
        }
      });

      return { ...p, studentSubmissions: updatedSubmissions };
    });

    this.projects.set(newProjects);
    const updatedProject = newProjects.find((p) => p.id === projectId);
    if (!updatedProject) return of(undefined);
    return this.http.put<Project>(`${this.apiUrl}/projects/${projectId}`, updatedProject, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de atualizar atribuições do projeto ${projectId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((proj) => {
        this.projects.update((projects) => projects.map((p) => (p.id === proj.id ? proj : p)));
      }),
      catchError(this.handlerErrors.handleError)
    );
  }

  updateStudentCode(projectId: number, studentId: number, language: 'html' | 'css' | 'js', content: string): Observable<Project | undefined> {
    const current = this.projects();
    const newProjects = current.map(p => {
      if (p.id !== projectId) return p;
      const updatedSubmissions = p.studentSubmissions.map(s => s.studentId === studentId ? { ...s, code: { ...s.code, [language]: content } } : s);
      return { ...p, studentSubmissions: updatedSubmissions };
    });

    this.projects.set(newProjects);
    const updatedProject = newProjects.find((p) => p.id === projectId);
    if (!updatedProject) return of(undefined);
    return this.http.put<Project>(`${this.apiUrl}/projects/${projectId}`, updatedProject, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de salvar alteração de código no projeto ${projectId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((proj) => this.projects.update((projects) => projects.map((p) => (p.id === proj.id ? proj : p)))),
      catchError(this.handlerErrors.handleError)
    );
  }

  saveCodeTimestamp(projectId: number, studentId: number) {
     this.projects.update(projects => {
      return projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            studentSubmissions: p.studentSubmissions.map(s => {
              if (s.studentId === studentId) {
                return { ...s, lastSaved: new Date() };
              }
              return s;
            })
          };
        }
        return p;
      });
    });
  }

  gradeStudentSubmission(projectId: number, studentId: number, grade: number, feedback: string): Observable<Project | undefined> {
    const current = this.projects();
    const newProjects = current.map(p => {
      if (p.id !== projectId) return p;
      const updatedProject = {
        ...p,
        studentSubmissions: p.studentSubmissions.map(s => s.studentId === studentId ? { ...s, grade, feedback } : s)
      };
      return updatedProject;
    });

    this.projects.set(newProjects);
    const updatedProject = newProjects.find((p) => p.id === projectId);
    if (!updatedProject) return of(undefined);
    return this.http.put<Project>(`${this.apiUrl}/projects/${projectId}`, updatedProject, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de aplicar nota no projeto ${projectId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((proj) => this.projects.update((projects) => projects.map((p) => (p.id === proj.id ? proj : p)))),
      catchError(this.handlerErrors.handleError)
    );
  }

  removeStudentSubmissions(studentId: number): Observable<any> {
    // Determine affected projects BEFORE modification
    const current = this.projects();
    const affectedBefore = current.filter(p => p.studentSubmissions.some(s => s.studentId === studentId));

    // Remove submissions from in-memory state
    this.projects.update(projects =>
      projects.map(p => ({
        ...p,
        studentSubmissions: p.studentSubmissions.filter(s => s.studentId !== studentId)
      }))
    );

    // Persist updates to backend only for those that were affected
    const updated = this.projects();
    const affectedAfter = updated.filter((p) => affectedBefore.some((a) => a.id === p.id));
    if (affectedAfter.length === 0) return of(null);
    const observables = affectedAfter.map((p) => this.http.put(`${this.apiUrl}/projects/${p.id}`, p, { headers: this.headers }).pipe(catchError((err) => {
      console.error('Failed to persist project update', err);
      return of(null);
    })));
    return forkJoin(observables).pipe(catchError(this.handlerErrors.handleError));
  }

  deleteProject(projectId: number): Observable<boolean> {
    return this.http.delete(`${this.apiUrl}/projects/${projectId}`, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de deletar projeto ${projectId} devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap(() => this.projects.update((projects) => projects.filter((p) => p.id !== projectId))),
      map(() => true),
      catchError((e) => {
        console.error('Failed to delete project', e);
        return of(false);
      })
    );
  }

  getProjectById(projectId: number): Observable<Project | null> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${projectId}`, { headers: this.headers }).pipe(catchError((err) => {
      console.error('Failed to get project by id', err);
      return of(null);
    }));
  }
}
