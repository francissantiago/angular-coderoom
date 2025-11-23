
import { Component, ChangeDetectionStrategy, input, output, effect, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeService, ClassGroup } from '@services/code.service';

@Component({
  selector: 'app-class-modal',
  templateUrl: './class-modal.component.html',
  styleUrls: ['./class-modal.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassModalComponent {
  classToEdit = input<ClassGroup | null>(null);
  close = output<void>();
  save = output<{ id: number | null; name: string; description: string; schedule: string; studentIds: number[] }>();

  private codeService = inject(CodeService);
  allStudents = this.codeService.students;
  
  className = signal('');
  classDescription = signal('');
  classSchedule = signal('');
  selectedStudentIds = signal<Set<number>>(new Set());

  constructor() {
    effect(() => {
      const classGroup = this.classToEdit();
      if (classGroup) {
        this.className.set(classGroup.name);
        this.classDescription.set(classGroup.description);
        this.classSchedule.set(classGroup.schedule);
        this.selectedStudentIds.set(new Set(classGroup.studentIds));
      } else {
        // Reset for new class creation
        this.className.set('');
        this.classDescription.set('');
        this.classSchedule.set('');
        this.selectedStudentIds.set(new Set());
      }
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

  onNameChange(event: Event) {
    this.className.set((event.target as HTMLInputElement).value);
  }

  onDescriptionChange(event: Event) {
    this.classDescription.set((event.target as HTMLTextAreaElement).value);
  }
  
  onScheduleChange(event: Event) {
    this.classSchedule.set((event.target as HTMLInputElement).value);
  }

  onSave() {
    if (!this.className().trim()) return; 
    
    this.save.emit({
      id: this.classToEdit()?.id ?? null,
      name: this.className(),
      description: this.classDescription(),
      schedule: this.classSchedule(),
      studentIds: Array.from(this.selectedStudentIds()),
    });
  }

  onClose() {
    this.close.emit();
  }
}
