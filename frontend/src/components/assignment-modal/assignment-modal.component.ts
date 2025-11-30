
import { Component, ChangeDetectionStrategy, input, output, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeService, Project, ClassGroup, Student } from '@services/code.service';

@Component({
  selector: 'app-assignment-modal',
  standalone: true,
  templateUrl: './assignment-modal.component.html',
  styleUrls: ['./assignment-modal.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentModalComponent {
  project = input.required<Project>();
  close = output<void>();
  save = output<number[]>();

  private codeService = inject(CodeService);
  allStudents = this.codeService.students;
  classGroups = this.codeService.classGroups;

  // Computed: Get the class this project belongs to
  projectClass = computed(() => {
    return this.classGroups().find(c => c.id === this.project().classId);
  });

  // Computed: Filter available students to ONLY those in the project's class
  eligibleStudents = computed<Student[]>(() => {
    const classGroup = this.projectClass();
    if (!classGroup) return [];
    return this.allStudents().filter(s => {
      const inStudents = (classGroup.students || []).some(st => st.id === s.id);
      const inLegacy = (classGroup.studentIds || []).includes(s.id);
      return inStudents || inLegacy;
    });
  });

  // Local state for checkbox management
  selectedStudentIds = signal<Set<number>>(new Set());

  // Computed signals for 'select all' checkbox state (based on ELIGIBLE students)
  areAllSelected = computed(() => {
    const students = this.eligibleStudents();
    if (students.length === 0) return false;
    const selectedIds = this.selectedStudentIds();
    return students.every(s => selectedIds.has(s.id));
  });

  someSelected = computed(() => {
    const selectedCount = this.selectedStudentIds().size;
    const totalEligible = this.eligibleStudents().length;
    return selectedCount > 0 && selectedCount < totalEligible;
  });

  constructor() {
    // This effect runs once when the component is created and whenever
    // the project input signal changes. It correctly initializes and updates
    // the selection set.
    effect(() => {
        const assignedIds = this.project().studentSubmissions.map(s => s.studentId);
        this.selectedStudentIds.set(new Set(assignedIds));
    });
  }
  
  onCheckboxChange(studentId: number, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.selectedStudentIds.update(currentSet => {
        const newSet = new Set(currentSet);
        if (isChecked) {
            newSet.add(studentId);
        } else {
            newSet.delete(studentId);
        }
        return newSet;
    });
  }

  toggleSelectAll(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
        // Select all ELIGIBLE students
        const allIds = new Set(this.eligibleStudents().map(s => s.id));
        this.selectedStudentIds.set(allIds);
    } else {
        this.selectedStudentIds.set(new Set());
    }
  }

  onSave() {
    this.save.emit(Array.from(this.selectedStudentIds()));
  }

  onClose() {
    this.close.emit();
  }
}
