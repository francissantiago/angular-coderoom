
import { Component, ChangeDetectionStrategy, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Project } from '@services/code.service';

@Component({
  selector: 'app-project-modal',
  templateUrl: './project-modal.component.html',
  styleUrls: ['./project-modal.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectModalComponent {
  projectToEdit = input<Project | null>(null);
  targetClassId = input<number | null>(null); // Required when creating a new project
  
  close = output<void>();
  save = output<{ id: number | null; classId: number | null; name: string; description: string }>();

  name = signal('');
  description = signal('');

  constructor() {
    effect(() => {
      const project = this.projectToEdit();
      if (project) {
        this.name.set(project.name);
        this.description.set(project.description);
      } else {
        this.name.set('');
        this.description.set('');
      }
    });
  }

  onNameChange(event: Event) {
    this.name.set((event.target as HTMLInputElement).value);
  }

  onDescriptionChange(event: Event) {
    this.description.set((event.target as HTMLTextAreaElement).value);
  }

  onSave() {
    if (!this.name().trim()) return;
    
    // If editing, we preserve existing structure. If new, we need targetClassId.
    const classId = this.projectToEdit()?.classId ?? this.targetClassId();

    this.save.emit({
      id: this.projectToEdit()?.id ?? null,
      classId: classId,
      name: this.name(),
      description: this.description(),
    });
  }

  onClose() {
    this.close.emit();
  }
}
