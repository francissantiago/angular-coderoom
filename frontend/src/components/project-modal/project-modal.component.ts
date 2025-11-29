
import { Component, ChangeDetectionStrategy, input, output, effect, signal, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Project, CodeService } from '@services/code.service';

@Component({
  selector: 'app-project-modal',
  standalone: true,
  templateUrl: './project-modal.component.html',
  styleUrls: ['./project-modal.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectModalComponent implements OnInit, OnDestroy {
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

  // Common component state and lifecycle
  isLoading = signal(false);
  private destroyed = new Subject<void>();
  private codeService = inject(CodeService);

  ngOnInit(): void {
    // placeholder if init logic is needed in future
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

  ngOnDestroy(): void {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
