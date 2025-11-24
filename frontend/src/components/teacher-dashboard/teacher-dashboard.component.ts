import {
  Component,
  ChangeDetectionStrategy,
  output,
  inject,
  signal,
  computed,
  effect,
  OnDestroy,
} from "@angular/core";
import { Subject, takeUntil } from "rxjs";
import { CommonModule } from "@angular/common";
import {
  CodeService,
  Project,
  ClassGroup,
  StudentSubmission,
  Student,
  Lesson,
  ClassSession,
  Certificate,
} from "@services/code.service";
import { AssignmentModalComponent } from "../assignment-modal/assignment-modal.component";
import { ClassModalComponent } from "../class-modal/class-modal.component";
import { ProjectModalComponent } from "../project-modal/project-modal.component";
import { CourseModuleModalComponent } from "../course-module-modal/course-module-modal.component";
import { SessionModalComponent } from "../session-modal/session-modal.component";
import { CertificateViewComponent } from "../certificate-view/certificate-view.component";
import { TableState } from "@utils/table.utils";
import { PaginationControlsComponent } from "../ui/pagination-controls.component";

@Component({
  selector: "app-teacher-dashboard",
  templateUrl: "./teacher-dashboard.component.html",
  styleUrls: ["./teacher-dashboard.component.scss"],
  imports: [
    CommonModule,
    AssignmentModalComponent,
    ClassModalComponent,
    ProjectModalComponent,
    CourseModuleModalComponent,
    SessionModalComponent,
    CertificateViewComponent,
    PaginationControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeacherDashboardComponent implements OnDestroy {
  selectProject = output<Project>();
  codeService = inject(CodeService);
  private destroyed = new Subject<void>();

  // Raw Data Signals
  rawProjects = this.codeService.projects;
  rawClassGroups = this.codeService.classGroups;
  rawAllStudents = this.codeService.students;
  rawClassSessions = this.codeService.classSessions;

  // --- Table States ---
  // 1. Global Student List (Main Dashboard)
  studentTable = new TableState<Student>();

  // 2. Classes Grid (Main Dashboard)
  classTable = new TableState<ClassGroup>();

  // 3. Class Detail - Students Table
  classStudentTable = new TableState<Student>();

  // 4. Class Detail - Planning (Lessons)
  lessonTable = new TableState<Lesson>();

  // 5. Class Detail - History (Sessions)
  sessionTable = new TableState<ClassSession>();

  // 6. Class Detail - Projects
  projectTable = new TableState<Project>();

  // State for navigation
  selectedClass = signal<ClassGroup | null>(null);

  // Computed helper for template usage (Fixes error)
  selectedClassStudents = computed(() => {
    const cGroup = this.selectedClass();
    if (!cGroup) return [];
    return this.rawAllStudents().filter((s) =>
      cGroup.studentIds.includes(s.id)
    );
  });

  // State for modals
  projectForAssignment = signal<Project | null>(null);
  showClassModal = signal(false);
  classToEdit = signal<ClassGroup | null>(null);
  showProjectModal = signal(false);
  projectToEdit = signal<Project | null>(null);
  targetClassIdForNewProject = signal<number | null>(null);
  showLessonModal = signal(false);
  lessonToEdit = signal<Lesson | null>(null);
  showSessionModal = signal(false);
  newStudentData = signal({
    name: "",
    email: "",
    enrollmentNumber: "",
    birthDate: "",
  });

  // Certificate States
  showCertificateManager = signal(false);
  certificateManagerData = signal<{
    student: Student;
    classGroup: ClassGroup;
    existingCert: Certificate | undefined;
  } | null>(null);
  showCertificateView = signal(false);
  selectedCertificate = signal<Certificate | null>(null);
  certificateStudent = signal<Student | null>(null);

  // Toast
  showToast = signal(false);
  toastMessage = signal("");

  constructor() {
    // Effect to sync raw data to Table States

    // 1. Global Students
    effect(
      () => {
        this.studentTable.setSource(this.rawAllStudents());
      },
      { allowSignalWrites: true }
    );

    // 2. Classes
    effect(
      () => {
        this.classTable.setSource(this.rawClassGroups());
      },
      { allowSignalWrites: true }
    );

    // 3. Detail View Tables (depend on selectedClass)
    effect(
      () => {
        const cGroup = this.selectedClass();
        const allSess = this.rawClassSessions();
        const allProj = this.rawProjects();

        if (cGroup) {
          // Filter Students
          this.classStudentTable.setSource(this.selectedClassStudents());
          this.classStudentTable.setPageSize(8); // Smaller page for grid cards

          // Lessons
          this.lessonTable.setSource(cGroup.lessons);

          // Sessions
          const sessions = allSess
            .filter((s) => s.classId === cGroup.id)
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
          this.sessionTable.setSource(sessions);

          // Projects
          const projects = allProj.filter((p) => p.classId === cGroup.id);
          this.projectTable.setSource(projects);
          this.projectTable.setPageSize(6);
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  onSelectProject(project: Project) {
    this.selectProject.emit(project);
  }

  // --- Navigation ---
  viewClass(classGroup: ClassGroup) {
    this.selectedClass.set(classGroup);
    // Reset search states for detail view
    this.classStudentTable.setSearch("");
    this.lessonTable.setSearch("");
    this.sessionTable.setSearch("");
    this.projectTable.setSearch("");
  }

  backToDashboard() {
    this.selectedClass.set(null);
  }

  // --- Table Helpers ---
  handleSearch(table: TableState<any>, event: Event) {
    const val = (event.target as HTMLInputElement).value;
    table.setSearch(val);
  }

  // --- Project Logic ---
  openProjectModal(
    project: Project | null,
    classId: number | null = null,
    event?: MouseEvent
  ) {
    if (event) event.stopPropagation();
    this.projectToEdit.set(project);
    this.targetClassIdForNewProject.set(classId);
    this.showProjectModal.set(true);
  }

  closeProjectModal() {
    this.showProjectModal.set(false);
    this.projectToEdit.set(null);
    this.targetClassIdForNewProject.set(null);
  }

  handleSaveProject(data: {
    id: number | null;
    classId: number | null;
    name: string;
    description: string;
  }) {
    if (data.id) {
      this.codeService
        .updateProjectDetails(data.id, data.name, data.description)
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => this.closeProjectModal(),
          error: (err) => console.error("Failed to update project", err),
        });
    } else {
      if (data.classId) {
        this.codeService
          .createNewProject(data.classId, data.name, data.description)
          .pipe(takeUntil(this.destroyed))
          .subscribe({
            next: () => this.closeProjectModal(),
            error: (err) => console.error("Failed to create project", err),
          });
      }
    }
  }

  // --- Student Logic ---
  updateNewStudentField(
    field: "name" | "email" | "enrollmentNumber" | "birthDate",
    event: Event
  ) {
    const value = (event.target as HTMLInputElement).value;
    this.newStudentData.update((data) => ({ ...data, [field]: value }));
  }

  addNewStudent() {
    const { name, email, enrollmentNumber, birthDate } = this.newStudentData();
    if (
      !name.trim() ||
      !email.trim() ||
      !enrollmentNumber.trim() ||
      !birthDate.trim()
    )
      return;
    this.codeService
      .addStudent({ name, email, enrollmentNumber, birthDate })
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: () =>
          this.newStudentData.set({
            name: "",
            email: "",
            enrollmentNumber: "",
            birthDate: "",
          }),
        error: (err) => console.error("Failed to add student", err),
      });
  }

  deleteStudent(studentId: number) {
    if (confirm("Tem certeza que deseja remover este aluno?")) {
      this.codeService
        .removeStudent(studentId)
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => {},
          error: (err) => console.error("Failed to remove student", err),
        });
    }
  }

  // --- Assignment Logic ---
  openAssignmentModal(project: Project, event: MouseEvent) {
    event.stopPropagation();
    this.projectForAssignment.set(project);
  }

  closeAssignmentModal() {
    this.projectForAssignment.set(null);
  }

  handleSaveAssignments(assignedStudentIds: number[]) {
    const project = this.projectForAssignment();
    if (project) {
      this.codeService
        .updateProjectAssignments(project.id, assignedStudentIds)
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => this.closeAssignmentModal(),
          error: (err) => console.error("Failed to update assignments", err),
        });
    }
  }

  // --- Class Logic ---
  openClassModal(classGroup: ClassGroup | null) {
    this.classToEdit.set(classGroup);
    this.showClassModal.set(true);
  }

  closeClassModal() {
    this.showClassModal.set(false);
    this.classToEdit.set(null);
  }

  handleSaveClass(data: {
    id: number | null;
    name: string;
    description: string;
    schedule: string;
    studentIds: number[];
  }) {
    if (data.id) {
      this.codeService
        .updateClassGroup(
          data.id,
          data.name,
          data.description,
          data.schedule,
          data.studentIds
        )
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => {
            const updated =
              this.codeService.classGroups().find((c) => c.id === data.id) ||
              null;
            this.selectedClass.set(updated);
            this.closeClassModal();
          },
          error: (err) => console.error("Failed to update class group", err),
        });
    } else {
      this.codeService
        .addNewClassGroup(
          data.name,
          data.description,
          data.schedule,
          data.studentIds
        )
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => this.closeClassModal(),
          error: (err) => console.error("Failed to add class group", err),
        });
    }
  }

  // --- Lesson Logic ---
  openLessonModal(lesson: Lesson | null) {
    this.lessonToEdit.set(lesson);
    this.showLessonModal.set(true);
  }

  closeLessonModal() {
    this.showLessonModal.set(false);
    this.lessonToEdit.set(null);
  }

  handleSaveLesson(data: {
    id: number | null;
    title: string;
    description: string;
    duration: string;
    status: "completed" | "in-progress" | "upcoming";
  }) {
    const durationNum = parseInt(data.duration) || 1;
    const currentClass = this.selectedClass();
    if (!currentClass) return;

    if (data.id) {
      this.codeService
        .updateLessonInClass(currentClass.id, {
          id: data.id,
          title: data.title,
          description: data.description,
          standardDuration: durationNum,
        })
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => {
            this.closeLessonModal();
            const updatedClass =
              this.codeService
                .classGroups()
                .find((g) => g.id === currentClass.id) || null;
            this.selectedClass.set(updatedClass);
          },
          error: (err) => console.error("Failed to update lesson", err),
        });
    } else {
      this.codeService
        .addLessonToClass(currentClass.id, {
          title: data.title,
          description: data.description,
          standardDuration: durationNum,
        })
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => {
            this.closeLessonModal();
            const updatedClass =
              this.codeService
                .classGroups()
                .find((g) => g.id === currentClass.id) || null;
            this.selectedClass.set(updatedClass);
          },
          error: (err) => console.error("Failed to add lesson", err),
        });
    }
    this.closeLessonModal();
    const updatedClass =
      this.codeService.classGroups().find((g) => g.id === currentClass.id) ||
      null;
    this.selectedClass.set(updatedClass);
  }

  async deleteLesson(lessonId: number) {
    const currentClass = this.selectedClass();
    if (!currentClass) return;
    if (confirm("Tem certeza que deseja remover esta aula?")) {
      this.codeService
        .removeLessonFromClass(currentClass.id, lessonId)
        .pipe(takeUntil(this.destroyed))
        .subscribe({
          next: () => {
            const updatedClass =
              this.codeService
                .classGroups()
                .find((g) => g.id === currentClass.id) || null;
            this.selectedClass.set(updatedClass);
          },
          error: (err) => console.error("Failed to remove lesson", err),
        });
    }
  }

  // --- Session Logic ---
  openSessionModal() {
    this.showSessionModal.set(true);
  }

  closeSessionModal() {
    this.showSessionModal.set(false);
  }

  // --- Helpers ---
  getStudentAttendance(studentId: number): number {
    const currentClass = this.selectedClass();
    if (!currentClass) return 0;
    this.rawClassSessions();
    return this.codeService.getStudentAttendancePercentage(
      studentId,
      currentClass.id
    );
  }

  getAttendanceColor(percentage: number): string {
    if (percentage < 75) return "text-red-400";
    if (percentage < 90) return "text-yellow-400";
    return "text-green-400";
  }

  getSessionCountForLesson(lessonId: number): number {
    const currentClass = this.selectedClass();
    if (!currentClass) return 0;
    return this.codeService.getSessionsForLesson(currentClass.id, lessonId)
      .length;
  }

  getLessonTitle(lessonId: number): string {
    const currentClass = this.selectedClass();
    if (!currentClass) return "Unknown Lesson";
    return (
      currentClass.lessons.find((l) => l.id === lessonId)?.title ||
      "Aula Excluída"
    );
  }

  getStudentCompletion(
    project: Project,
    submission: StudentSubmission
  ): number {
    return this.codeService.calculateCompletionPercentage(
      submission.code,
      project.teacherCode
    );
  }

  // --- Certificate Logic ---
  openCertificateManager(student: Student) {
    const currentClass = this.selectedClass();
    if (!currentClass) return;
    const existingCert = this.codeService.getCertificate(
      student.id,
      currentClass.id
    );
    this.certificateManagerData.set({
      student,
      classGroup: currentClass,
      existingCert,
    });
    this.showCertificateManager.set(true);
  }

  closeCertificateManager() {
    this.showCertificateManager.set(false);
    this.certificateManagerData.set(null);
  }

  issueCertificateInManager() {
    const data = this.certificateManagerData();
    if (!data) return;
    this.codeService
      .issueCertificate(data.student.id, data.classGroup.id)
      .pipe(takeUntil(this.destroyed))
      .subscribe({
        next: (newCert) => {
          this.certificateManagerData.set({ ...data, existingCert: newCert });
          this.triggerToast("Certificado emitido com sucesso!");
        },
        error: (err) => console.error("Failed to issue certificate", err),
      });
  }

  previewCertificateFromManager() {
    const data = this.certificateManagerData();
    if (!data) return;
    const previewCert = data.existingCert || {
      id: "PREVIEW",
      studentId: data.student.id,
      classId: data.classGroup.id,
      issueDate: new Date().toISOString(),
      validationCode: "PREVIEW-MODE",
    };
    this.certificateStudent.set(data.student);
    this.selectedCertificate.set(previewCert);
    this.showCertificateView.set(true);
  }

  sendCertificateEmail() {
    const data = this.certificateManagerData();
    if (!data || !data.existingCert) return;
    this.triggerToast(`E-mail enviado para ${data.student.email}`);
  }

  closeCertificateView() {
    this.showCertificateView.set(false);
    this.selectedCertificate.set(null);
    this.certificateStudent.set(null);
  }

  triggerToast(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }
}
