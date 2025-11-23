
import { Injectable, signal, inject } from '@angular/core';
import { Project, Student } from '../models/domain.models';
import { StudentService } from './student.service';
import { HttpClient } from '@angular/common/http';

// Projects are loaded from the API; mock data removed.

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projects = signal<Project[]>([]);
  private studentService = inject(StudentService);
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';

  constructor() {
    this.loadProjects();
  }

  async loadProjects() {
    try {
      const list = await this.http.get<Project[]>(`${this.baseUrl}/projects`).toPromise();
      this.projects.set(list || []);
    } catch (error) {
      console.error('Failed to load projects', error);
      this.projects.set([]);
    }
  }

  async createNewProject(classId: number, name: string, description: string) {
    const payload: Partial<Project> = {
      classId,
      name,
      description,
      teacherCode: { html: '<h1>Novo Projeto</h1>', css: 'body { background: #eee; }', js: 'console.log("Comece aqui!");' },
      studentSubmissions: [],
    };
    try {
      const created = await this.http.post<Project>(`${this.baseUrl}/projects`, payload).toPromise();
      this.projects.update(projects => [...projects, created]);
      return created;
    } catch (error) {
      console.error('Failed to create project', error);
      throw error;
    }
  }

  async updateProjectDetails(id: number, name: string, description: string) {
    const project = this.projects().find(p => p.id === id);
    if (!project) return null;
    const updated = { ...project, name, description } as Project;
    try {
      const resp = await this.http.put<Project>(`${this.baseUrl}/projects/${id}`, updated).toPromise();
      this.projects.update(projects => projects.map(p => p.id === id ? resp : p));
      return resp;
    } catch (error) {
      console.error('Failed to update project', error);
      return null;
    }
  }

  async updateProjectAssignments(projectId: number, assignedStudentIds: number[]) {
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

    // Update signal
    this.projects.set(newProjects);

    // Persist change to backend for the updated project
    const updatedProject = newProjects.find(p => p.id === projectId);
    if (updatedProject) {
      try {
        await this.http.put(`${this.baseUrl}/projects/${projectId}`, updatedProject).toPromise();
      } catch (err) {
        console.error('Failed to persist project assignments', err);
      }
    }
  }

  async updateStudentCode(projectId: number, studentId: number, language: 'html' | 'css' | 'js', content: string) {
    const current = this.projects();
    const newProjects = current.map(p => {
      if (p.id !== projectId) return p;
      const updatedSubmissions = p.studentSubmissions.map(s => s.studentId === studentId ? { ...s, code: { ...s.code, [language]: content } } : s);
      return { ...p, studentSubmissions: updatedSubmissions };
    });

    this.projects.set(newProjects);

    // Persist change to backend
    const updatedProject = newProjects.find(p => p.id === projectId);
    if (updatedProject) {
      try {
        await this.http.put(`${this.baseUrl}/projects/${projectId}`, updatedProject).toPromise();
      } catch (err) {
        console.error('Failed to persist code update', err);
      }
    }
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

  async gradeStudentSubmission(projectId: number, studentId: number, grade: number, feedback: string) {
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

    const updatedProject = newProjects.find(p => p.id === projectId);
    if (updatedProject) {
      try {
        await this.http.put(`${this.baseUrl}/projects/${projectId}`, updatedProject).toPromise();
      } catch (err) {
        console.error('Failed to persist grade update', err);
      }
    }
  }

  async removeStudentSubmissions(studentId: number) {
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
    const affectedAfter = updated.filter(p => affectedBefore.some(a => a.id === p.id));
    const persPromises = affectedAfter.map(p => this.http.put(`${this.baseUrl}/projects/${p.id}`, p).toPromise().catch(err => console.error('Failed to persist project update', err)));
    await Promise.all(persPromises);
  }

  async deleteProject(projectId: number) {
    try {
      await this.http.delete(`${this.baseUrl}/projects/${projectId}`).toPromise();
      this.projects.update(projects => projects.filter(p => p.id !== projectId));
      return true;
    } catch (error) {
      console.error('Failed to delete project', error);
      return false;
    }
  }

  async getProjectById(projectId: number) {
    try {
      const resp = await this.http.get<Project>(`${this.baseUrl}/projects/${projectId}`).toPromise();
      return resp;
    } catch (error) {
      console.error('Failed to get project by id', error);
      return null;
    }
  }
}
