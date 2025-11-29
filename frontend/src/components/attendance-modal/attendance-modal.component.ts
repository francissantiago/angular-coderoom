
import { Component, ChangeDetectionStrategy, input, output, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CodeService, Student, ClassGroup } from '@services/code.service';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-attendance-modal',
  standalone: true,
  templateUrl: './attendance-modal.component.html',
  styleUrls: ['./attendance-modal.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttendanceModalComponent {
  classGroup = input.required<ClassGroup>();
  students = input.required<Student[]>(); // Students belonging to this class
  
  close = output<void>();
  
    private codeService = inject(CodeService);
    private destroyed = new Subject<void>();

    // Loading state while persisting
    isLoading = signal(false);

    // Message de erro exibida na UI quando falha
    errorMessage = signal('');

  // Local State
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  presenceMap = signal<Record<number, boolean>>({});

  constructor() {
      // When date changes or input changes, load existing attendance
      effect(() => {
          const date = this.selectedDate();
          const cGroup = this.classGroup();
          const studentList = this.students();

          // Load record from service
          const existingRecord = this.codeService.getAttendanceRecord(cGroup.id, date);
          
          const newMap: Record<number, boolean> = {};
          studentList.forEach(s => {
              if (existingRecord) {
                  newMap[s.id] = existingRecord.presentStudentIds.includes(s.id);
              } else {
                  newMap[s.id] = true; // Default to present if no record exists yet
              }
          });
          this.presenceMap.set(newMap);
      }, { allowSignalWrites: true });
  }

  onDateChange(event: Event) {
    this.selectedDate.set((event.target as HTMLInputElement).value);
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
            const map = this.presenceMap();
            const presentIds = Object.keys(map)
                .map(Number)
                .filter(id => map[id]); // Filter where value is true

            this.isLoading.set(true);

            this.codeService
                .saveAttendance(this.classGroup().id, this.selectedDate(), presentIds)
                .pipe(takeUntil(this.destroyed), finalize(() => this.isLoading.set(false)))
                .subscribe({
                    next: () => {
                        this.close.emit();
                    },
                    error: (err: any) => {
                        const msg = err?.message || 'Erro ao salvar presença. Tente novamente.';
                        this.errorMessage.set(msg);
                        console.error('Erro ao salvar presença:', err);
                    },
                });
  }

  onClose() {
      this.close.emit();
  }

    ngOnDestroy() {
        this.destroyed.next();
        this.destroyed.complete();
    }
}
