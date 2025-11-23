
import { Component, ChangeDetectionStrategy, input, output, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeService, Student, ClassGroup, Lesson } from '@services/code.service';

@Component({
  selector: 'app-session-modal',
  templateUrl: './session-modal.component.html',
  styleUrls: ['./session-modal.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionModalComponent {
  classGroup = input.required<ClassGroup>();
  students = input.required<Student[]>();
  
  close = output<void>();
  
  private codeService = inject(CodeService);

  // Local State
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);
  selectedLessonId = signal<number | null>(null);
  observation = signal<string>('');
  
  // Presence Map
  presenceMap = signal<Record<number, boolean>>({});

  constructor() {
    // Initialize all students as present by default
    const map: Record<number, boolean> = {};
    // We can't access inputs in constructor easily without effect, 
    // but since we need initial state, we'll set it in the template logic or effect
  }

  ngOnInit() {
    const map: Record<number, boolean> = {};
    this.students().forEach(s => map[s.id] = true);
    this.presenceMap.set(map);
    
    // Default to first lesson if available
    if (this.classGroup().lessons.length > 0) {
        this.selectedLessonId.set(this.classGroup().lessons[0].id);
    }
  }

  onDateChange(event: Event) {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  onLessonChange(event: Event) {
    this.selectedLessonId.set(Number((event.target as HTMLSelectElement).value));
  }

  onObservationChange(event: Event) {
      this.observation.set((event.target as HTMLTextAreaElement).value);
  }

  togglePresence(studentId: number) {
      this.presenceMap.update(map => ({
          ...map,
          [studentId]: !map[studentId]
      }));
  }

  toggleSelectAll(event: Event) {
      const isChecked = (event.target as HTMLInputElement).checked;
      const studentList = this.students();
      const newMap: Record<number, boolean> = {};
      studentList.forEach(s => newMap[s.id] = isChecked);
      this.presenceMap.set(newMap);
  }

  get allSelected(): boolean {
      const map = this.presenceMap();
      const studentList = this.students();
      if (studentList.length === 0) return false;
      return studentList.every(s => map[s.id]);
  }

  get someSelected(): boolean {
      const map = this.presenceMap();
      const studentList = this.students();
      const presentCount = studentList.filter(s => map[s.id]).length;
      return presentCount > 0 && presentCount < studentList.length;
  }

  onSave() {
      const lessonId = this.selectedLessonId();
      if (!lessonId) return;

      const map = this.presenceMap();
      const presentIds = Object.keys(map)
        .map(Number)
        .filter(id => map[id]);
      
      this.codeService.registerClassSession({
          classId: this.classGroup().id,
          date: this.selectedDate(),
          lessonId: lessonId,
          observation: this.observation(),
          presentStudentIds: presentIds
      });
      
      this.close.emit();
  }

  onClose() {
      this.close.emit();
  }
}
