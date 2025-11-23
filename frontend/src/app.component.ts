
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EditorComponent } from '@components/editor/editor.component';
import { PreviewComponent } from '@components/preview/preview.component';
import { CodeService, Project, CodeState } from './services/code.service';
import { ChatComponent } from '@components/chat/chat.component';
import { StudentDashboardComponent } from '@components/student-dashboard/student-dashboard.component';
import { TeacherDashboardComponent } from '@components/teacher-dashboard/teacher-dashboard.component';
import { AssignmentModalComponent } from '@components/assignment-modal/assignment-modal.component';
import { ClassModalComponent } from '@components/class-modal/class-modal.component';
import { AuthService } from './services/auth.service';
import { LoginComponent } from '@components/login/login.component';
import { ThemeService } from './services/theme.service';
import { PaginationControlsComponent } from '@components/ui/pagination-controls.component';

type ActiveTab = 'html' | 'css' | 'js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    EditorComponent,
    PreviewComponent,
    ChatComponent,
    StudentDashboardComponent,
    TeacherDashboardComponent,
    LoginComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  authService = inject(AuthService);
  codeService = inject(CodeService);
  themeService = inject(ThemeService);

  // --- Global State ---
  currentUser = this.authService.currentUser;
  userRole = computed(() => this.currentUser()?.role ?? null);
  isDarkMode = this.themeService.currentTheme;
  
  showSaveToast = signal(false);
  
  // --- Project & View State ---
  activeProject = this.codeService.activeProject;
  
  // --- Local UI State for Coderoom ---
  activeTab = signal<ActiveTab>('html');
  showTeacherCode = signal<boolean>(false);

  // --- Grading State ---
  gradeInput = signal<number | null>(null);
  feedbackInput = signal<string>('');

  // --- Chat State (Floating) ---
  isChatOpen = signal(false);
  chatPosition = signal({ x: 0, y: 0 }); 
  isDragging = signal(false);
  private dragOffset = { x: 0, y: 0 };

  // --- Computed signals for providing code to editors ---
  studentCode = computed<CodeState | null>(() => {
    return this.codeService.currentUserSubmission()?.code ?? null
  });
  
  teacherCode = computed<CodeState | null>(() => {
    return this.activeProject()?.teacherCode ?? null
  });

  teacherEditorCode = computed<CodeState | null>(() => {
    return this.codeService.viewedStudentSubmission()?.code ?? this.teacherCode();
  });

  teacherEditorTitle = computed<string>(() => {
    const student = this.codeService.viewedStudentSubmission();
    const lang = this.activeTab().toUpperCase();
    return student ? `Código de ${student.studentName} (${lang})` : `Código do Professor (${lang})`;
  });

  previewDocument = computed(() => {
    const project = this.activeProject();
    if (!project) return '';

    let codeToPreview: CodeState | null = null;
    
    if (this.userRole() === 'teacher') {
      codeToPreview = this.codeService.viewedStudentSubmission()?.code ?? project.teacherCode;
    } else {
      codeToPreview = this.studentCode();
    }
    
    if (!codeToPreview) return '';

    return `
      <!DOCTYPE html>
      <html lang="en"><head><style>${codeToPreview.css}</style></head>
      <body>
        ${codeToPreview.html}
        <script>try { ${codeToPreview.js} } catch (e) { console.error(e); }<\/script>
      </body></html>
    `;
  });

  // --- Methods ---

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  logout() {
      this.authService.logout();
      this.codeService.deselectProject();
      this.activeTab.set('html');
      this.showTeacherCode.set(false);
  }

  selectProject(project: Project) {
    this.codeService.selectProject(project.id);
  }

  deselectProject() {
    this.codeService.deselectProject();
  }

  setTab(tab: ActiveTab) {
    this.activeTab.set(tab);
  }

  toggleTeacherCode() {
    this.showTeacherCode.update(v => !v);
  }

  updateCode(language: 'html' | 'css' | 'js', content: string) {
    this.codeService.updateStudentCode(language, content);
  }

  saveCode() {
    this.codeService.saveCode();
    this.showSaveToast.set(true);
    setTimeout(() => this.showSaveToast.set(false), 3000);
  }

  async formatCode() {
    const lang = this.activeTab();
    const currentCode = this.studentCode();
    if (!currentCode) return;
    const codeToFormat = currentCode[lang];
    const formattedCode = await this.codeService.formatCode(lang, codeToFormat);
    this.codeService.updateStudentCode(lang, formattedCode);
  }

  selectStudent(studentId: number | null) {
    this.codeService.selectStudentToView(studentId);
    
    // Load grading data if a student is selected
    const submission = this.codeService.viewedStudentSubmission();
    if (submission) {
      this.gradeInput.set(submission.grade ?? null);
      this.feedbackInput.set(submission.feedback ?? '');
    } else {
      this.gradeInput.set(null);
      this.feedbackInput.set('');
    }
  }

  onGradeInput(event: Event) {
    const value = (event.target as HTMLInputElement).valueAsNumber;
    this.gradeInput.set(isNaN(value) ? null : value);
  }

  onFeedbackInput(event: Event) {
    this.feedbackInput.set((event.target as HTMLTextAreaElement).value);
  }

  submitGrade() {
    const project = this.activeProject();
    const studentId = this.codeService.viewedStudentId();
    const grade = this.gradeInput();
    const feedback = this.feedbackInput();

    if (project && studentId && grade !== null) {
      this.codeService.gradeStudentSubmission(project.id, studentId, grade, feedback);
      this.showSaveToast.set(true);
      setTimeout(() => this.showSaveToast.set(false), 3000);
    }
  }

  toggleChat() {
    this.isChatOpen.update(v => !v);
  }

  startDrag(event: MouseEvent) {
    this.isDragging.set(true);
    const container = (event.currentTarget as HTMLElement).closest('.floating-chat-container') as HTMLElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    this.dragOffset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  onDrag(event: MouseEvent) {
    if (!this.isDragging()) return;
    event.preventDefault();

    const x = event.clientX - this.dragOffset.x;
    const y = event.clientY - this.dragOffset.y;

    this.chatPosition.set({ x, y });
  }

  stopDrag() {
    this.isDragging.set(false);
  }
}
