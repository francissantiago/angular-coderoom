
import { Component, ChangeDetectionStrategy, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Lesson } from '@services/code.service';

@Component({
  selector: 'app-course-module-modal',
  templateUrl: './course-module-modal.component.html',
  styleUrls: ['./course-module-modal.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseModuleModalComponent {
  moduleToEdit = input<Lesson | null>(null);
  
  close = output<void>();
  save = output<{ id: number | null; title: string; description: string; duration: string; status: 'completed' | 'in-progress' | 'upcoming' }>();

  title = signal('');
  description = signal('');
  duration = signal('');
  status = signal<'completed' | 'in-progress' | 'upcoming'>('upcoming');

  constructor() {
    effect(() => {
      const mod = this.moduleToEdit();
      if (mod) {
        this.title.set(mod.title);
        this.description.set(mod.description);
        this.duration.set(String(mod.standardDuration));
        this.status.set('upcoming'); // Lesson does not have status
      } else {
        this.title.set('');
        this.description.set('');
        this.duration.set('');
        this.status.set('upcoming');
      }
    });
  }

  onTitleChange(event: Event) {
    this.title.set((event.target as HTMLInputElement).value);
  }

  onDescriptionChange(event: Event) {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  onDurationChange(event: Event) {
    this.duration.set((event.target as HTMLInputElement).value);
  }

  onStatusChange(event: Event) {
      this.status.set((event.target as HTMLSelectElement).value as any);
  }

  onSave() {
    if (!this.title().trim()) return;
    
    this.save.emit({
      id: this.moduleToEdit()?.id ?? null,
      title: this.title(),
      description: this.description(),
      duration: this.duration(),
      status: this.status(),
    });
  }

  onClose() {
    this.close.emit();
  }
}
