
import { Injectable, signal, computed, inject } from '@angular/core';
import { CodeState, Project, Student, ClassGroup, ClassSession, Lesson, StudentSubmission, Certificate } from '../models/domain.models';
import { StudentService } from './student.service';
import { ClassService } from './class.service';
import { ProjectService } from './project.service';
import { AttendanceService } from './attendance.service';
import { CertificateService } from './certificate.service';
import { AuthService } from './auth.service';

// Add declarations for Prettier loaded from CDN
declare var prettier: {
  format(source: string, options: any): Promise<string>;
};
declare var prettierPlugins: {
  html: any;
  babel: any;
  estree: any;
  postcss: any;
};

// Re-export types for compatibility
export type { CodeState, Project, Student, ClassGroup, StudentSubmission, Lesson, ClassSession, Certificate } from '../models/domain.models';

@Injectable({
  providedIn: 'root',
})
export class CodeService {
  // Inject domain services
  private authService = inject(AuthService);
  private studentService = inject(StudentService);
  private classService = inject(ClassService);
  private projectService = inject(ProjectService);
  private attendanceService = inject(AttendanceService);
  private certificateService = inject(CertificateService);

  // --- Facade Signals (Re-exporting for component compatibility) ---
  projects = this.projectService.projects;
  students = this.studentService.students;
  classGroups = this.classService.classGroups;
  // Expose sessions instead of raw records
  classSessions = this.attendanceService.sessions;
  
  // --- Editor Session State ---
  activeProjectId = signal<number | null>(null);
  viewedStudentId = signal<number | null>(null); // For teacher viewing a student
  
  // Helper getter for authentication awareness
  private get currentStudentId(): number {
      const user = this.authService.currentUser();
      return (user && user.role === 'student') ? user.id : 0;
  }

  // --- Computed Signals for Active State ---
  activeProject = computed(() => {
    const activeId = this.activeProjectId();
    if (!activeId) return null;
    return this.projects().find(p => p.id === activeId) ?? null;
  });

  // The student submission being viewed by a teacher
  viewedStudentSubmission = computed(() => {
    const project = this.activeProject();
    const studentId = this.viewedStudentId();
    if (!project || !studentId) return null;
    return project.studentSubmissions.find(s => s.studentId === studentId) ?? null;
  });

  // The current user's (student's) submission for the active project
  currentUserSubmission = computed(() => {
    const project = this.activeProject();
    const currentId = this.currentStudentId;
    if (!project || !currentId) return null;
    return project.studentSubmissions.find(s => s.studentId === currentId) ?? null;
  });

  // The current user's (student's) assigned projects for the dashboard
  assignedProjectsForCurrentUser = computed(() => {
    const studentId = this.currentStudentId;
    if(!studentId) return [];
    
    return this.projects().filter(p => 
      p.studentSubmissions.some(s => s.studentId === studentId)
    );
  });

  // The classes the current student is enrolled in
  enrolledClassesForCurrentUser = computed(() => {
    const studentId = this.currentStudentId;
    if(!studentId) return [];

    return this.classGroups().filter(c => c.studentIds.includes(studentId));
  });


  // --- Combined Code for Preview (Editor Logic) ---
  previewDocument = computed(() => {
    const project = this.activeProject();
    if (!project) return '';

    let codeToPreview: CodeState | null = null;
    
    // In teacher view, preview the selected student, or the teacher's own code
    const viewedStudent = this.viewedStudentSubmission();
    if (viewedStudent) {
      codeToPreview = viewedStudent.code;
    } else { 
      const studentSubmission = this.currentUserSubmission();
      codeToPreview = this.viewedStudentSubmission()?.code ?? studentSubmission?.code ?? project.teacherCode;
    }

    if (!codeToPreview) return '';
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview</title>
        <style>
          ${codeToPreview.css}
        </style>
      </head>
      <body>
        ${codeToPreview.html}
        <script>
          try {
            ${codeToPreview.js}
          } catch (e) {
            console.error(e);
          }
        <\/script>
      </body>
      </html>
    `;
  });

  // --- Session Methods ---

  selectProject(projectId: number) {
    this.activeProjectId.set(projectId);
    this.viewedStudentId.set(null); // Reset student view when changing project
  }

  deselectProject() {
    this.activeProjectId.set(null);
  }

  selectStudentToView(studentId: number | null) {
    this.viewedStudentId.set(studentId);
  }

  getCurrentStudentId(): number {
    return this.currentStudentId;
  }

  getStudentById(studentId: number): Student | undefined {
    return this.studentService.getStudentById(studentId);
  }

  // --- Project Facade Methods ---
  createNewProject(classId: number, name: string, description: string) {
    this.projectService.createNewProject(classId, name, description);
  }

  updateProjectDetails(id: number, name: string, description: string) {
    this.projectService.updateProjectDetails(id, name, description);
  }
  
  updateStudentCode(language: 'html' | 'css' | 'js', content: string) {
    const projectId = this.activeProjectId();
    if (!projectId) return;
    this.projectService.updateStudentCode(projectId, this.currentStudentId, language, content);
  }

  updateProjectAssignments(projectId: number, assignedStudentIds: number[]) {
    this.projectService.updateProjectAssignments(projectId, assignedStudentIds);
  }

  saveCode() {
    const projectId = this.activeProjectId();
    if (!projectId) return;
    this.projectService.saveCodeTimestamp(projectId, this.currentStudentId);
  }

  gradeStudentSubmission(projectId: number, studentId: number, grade: number, feedback: string) {
    this.projectService.gradeStudentSubmission(projectId, studentId, grade, feedback);
  }

  // --- Class Facade Methods ---
  addNewClassGroup(name: string, description: string, schedule: string, studentIds: number[]) {
    this.classService.addNewClassGroup(name, description, schedule, studentIds);
  }

  updateClassGroup(classId: number, name: string, description: string, schedule: string, studentIds: number[]) {
    this.classService.updateClassGroup(classId, name, description, schedule, studentIds);
  }

  addLessonToClass(classId: number, lessonData: Omit<Lesson, 'id'>) {
    this.classService.addLessonToClass(classId, lessonData);
  }

  updateLessonInClass(classId: number, lesson: Lesson) {
    this.classService.updateLessonInClass(classId, lesson);
  }

  removeLessonFromClass(classId: number, lessonId: number) {
    this.classService.removeLessonFromClass(classId, lessonId);
  }

  // --- Student Facade Methods ---
  addStudent(data: { name: string; email: string; enrollmentNumber: string; birthDate: string }) {
    this.studentService.addStudent(data);
  }

  removeStudent(studentId: number) {
    // Orchestrate deletion across all domains
    this.studentService.removeStudent(studentId);
    this.classService.removeStudentFromClasses(studentId);
    this.projectService.removeStudentSubmissions(studentId);
    this.attendanceService.removeStudentFromAttendance(studentId);
  }

  // --- Session / Attendance Facade Methods ---
  registerClassSession(data: Omit<ClassSession, 'id'>) {
    this.attendanceService.registerSession(data);
  }

  getAttendanceRecord(classId: number, date: string): ClassSession | undefined {
      // Helper for the legacy or specific date check
      return this.attendanceService.getSessionsByClass(classId).find(s => s.date === date);
  }
  
  saveAttendance(classId: number, date: string, presentStudentIds: number[]) {
      // This acts as an update or insert for a specific date without lesson context
      // Ideally we use registerClassSession, but for compatibility with the basic modal:
      const existing = this.getAttendanceRecord(classId, date);
      if(existing) {
          // We don't have an update method exposed in attendance service yet for full object,
          // but we can simulate it or just add a simple update method there. 
          // For now, let's just assume we are using the new SessionModal primarily.
          console.warn("Use SessionModal for full fidelity.");
      }
  }

  getClassSessions(classId: number): ClassSession[] {
    return this.attendanceService.getSessionsByClass(classId);
  }
  
  getSessionsForLesson(classId: number, lessonId: number): ClassSession[] {
      return this.attendanceService.getSessionsByLesson(classId, lessonId);
  }

  getStudentAttendancePercentage(studentId: number, classId: number): number {
    return this.attendanceService.getStudentAttendancePercentage(studentId, classId);
  }

  // --- Certificate Facade Methods ---
  issueCertificate(studentId: number, classId: number): Certificate {
    return this.certificateService.issueCertificate(studentId, classId);
  }

  getCertificate(studentId: number, classId: number): Certificate | undefined {
    return this.certificateService.getCertificate(studentId, classId);
  }

  getStudentCertificates(studentId: number): Certificate[] {
    return this.certificateService.getCertificatesForStudent(studentId);
  }

  // --- Editor Utility Methods ---
  public async formatCode(language: 'html' | 'css' | 'js', code: string): Promise<string> {
    try {
      let parser: string;
      let plugins: any[];

      switch (language) {
        case 'html':
          parser = 'html';
          plugins = [prettierPlugins.html];
          break;
        case 'css':
          parser = 'css';
          plugins = [prettierPlugins.postcss];
          break;
        case 'js':
          parser = 'babel';
          plugins = [prettierPlugins.babel, prettierPlugins.estree];
          break;
      }

      return await prettier.format(code, {
        parser,
        plugins,
        tabWidth: 2,
        semi: true,
        singleQuote: true,
      });
    } catch (e) {
      console.error(`Error formatting ${language}:`, e);
      return code;
    }
  }

  calculateCompletionPercentage(studentCode: CodeState, teacherCode: CodeState): number {
    const getLength = (code: string) => code.replace(/\s/g, '').length;

    const teacherLen = getLength(teacherCode.html) + getLength(teacherCode.css) + getLength(teacherCode.js);
    const studentLen = getLength(studentCode.html) + getLength(studentCode.css) + getLength(studentCode.js);

    if (teacherLen === 0) return 100; 

    let percent = (studentLen / teacherLen) * 100;
    return Math.min(100, Math.round(percent));
  }

  getProjectCompletionForCurrentUser(project: Project): number {
    const submission = project.studentSubmissions.find(s => s.studentId === this.currentStudentId);
    if (!submission) return 0;
    return this.calculateCompletionPercentage(submission.code, project.teacherCode);
  }
}
