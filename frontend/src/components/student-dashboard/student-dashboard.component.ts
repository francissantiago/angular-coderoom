
import { Component, ChangeDetectionStrategy, output, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeService, Project, StudentSubmission, ClassGroup, Lesson, Certificate, Student } from '@services/code.service';
import { CertificateViewComponent } from '../certificate-view/certificate-view.component';
import { TableState } from '@utils/table.utils';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss'],
  imports: [CommonModule, CertificateViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardComponent {
  selectProject = output<Project>();
  codeService = inject(CodeService);

  // Data Signals
  rawProjects = this.codeService.assignedProjectsForCurrentUser;
  classes = this.codeService.enrolledClassesForCurrentUser;
  
  // Mock Current User ID (matched from CodeService)
  private currentStudentId = this.codeService.getCurrentStudentId();

  // Certificates State
  myCertificates = computed(() => this.codeService.getStudentCertificates(this.currentStudentId));
  showCertificate = signal(false);
  selectedCertificate = signal<Certificate | null>(null);
  selectedCertificateClass = signal<ClassGroup | null>(null);
  currentStudent = computed(() => this.codeService.getStudentById(this.currentStudentId));

  // Computed Global Stats
  globalAttendance = computed(() => {
      const myClasses = this.classes();
      if (myClasses.length === 0) return 0;
      const total = myClasses.reduce((sum, c) => sum + this.getClassAttendance(c.id), 0);
      return Math.round(total / myClasses.length);
  });

  globalAvgGrade = computed(() => {
      const myClasses = this.classes();
      if (myClasses.length === 0) return 0;
      let totalGrade = 0;
      let count = 0;
      myClasses.forEach(c => {
          const avg = this.getClassAvgGrade(c.id);
          if (avg > 0) {
              totalGrade += avg;
              count++;
          }
      });
      return count === 0 ? 0 : Math.round(totalGrade / count);
  });

  onSelectProject(project: Project) {
    this.selectProject.emit(project);
  }

  getCompletion(project: Project): number {
    return this.codeService.getProjectCompletionForCurrentUser(project);
  }

  getSubmission(project: Project): StudentSubmission | undefined {
    return project.studentSubmissions.find(s => s.studentId === this.currentStudentId);
  }

  // --- Certificate Methods ---
  viewCertificate(cert: Certificate) {
    const classGroup = this.classes().find(c => c.id === cert.classId);
    if (classGroup) {
      this.selectedCertificateClass.set(classGroup);
      this.selectedCertificate.set(cert);
      this.showCertificate.set(true);
    }
  }

  closeCertificate() {
    this.showCertificate.set(false);
    this.selectedCertificate.set(null);
    this.selectedCertificateClass.set(null);
  }
  
  getClassName(classId: number): string {
    return this.classes().find(c => c.id === classId)?.name || 'Turma Desconhecida';
  }

  // --- Analytics Helpers ---
  getClassAttendance(classId: number): number {
      return this.codeService.getStudentAttendancePercentage(this.currentStudentId, classId);
  }

  getClassAvgGrade(classId: number): number {
      const classProjects = this.rawProjects().filter(p => p.classId === classId);
      if (classProjects.length === 0) return 0;

      let totalGrade = 0;
      let gradedCount = 0;
      classProjects.forEach(p => {
          const submission = p.studentSubmissions.find(s => s.studentId === this.currentStudentId);
          if (submission && submission.grade !== undefined && submission.grade !== null) {
              totalGrade += submission.grade;
              gradedCount++;
          }
      });
      return gradedCount === 0 ? 0 : Math.round(totalGrade / gradedCount);
  }

  // We need to filter projects per class inside the template loop.
  // To support search within each class card, we can use a simple method or a map of TableStates.
  // For simplicity in this nested view, we'll implement a simple local search method 
  // rather than full pagination for every single class card, as usually student class projects are few.
  projectSearchTerm = signal<Record<number, string>>({});

  updateProjectSearch(classId: number, event: Event) {
      const val = (event.target as HTMLInputElement).value;
      this.projectSearchTerm.update(map => ({...map, [classId]: val }));
  }

  getProjectsForClass(classId: number): Project[] {
      const term = this.projectSearchTerm()[classId]?.toLowerCase() || '';
      let projects = this.rawProjects().filter(p => p.classId === classId);
      
      if(term) {
          projects = projects.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
      }
      return projects;
  }

  // --- Lesson Specific Stats ---
  getLessonStats(classId: number, lessonId: number) {
    const sessions = this.codeService.getSessionsForLesson(classId, lessonId);
    
    if (sessions.length === 0) {
      return {
        status: 'upcoming',
        label: 'Não Iniciada',
        percent: 0,
        totalClasses: 0,
        presentClasses: 0,
        lastDate: null
      };
    }

    const totalClasses = sessions.length;
    const presentClasses = sessions.filter(s => s.presentStudentIds.includes(this.currentStudentId)).length;
    const percent = Math.round((presentClasses / totalClasses) * 100);
    const lastDate = sessions[0].date; 

    return {
      status: 'completed',
      label: `${percent}% Frequência`,
      percent,
      totalClasses,
      presentClasses,
      lastDate
    };
  }
}
