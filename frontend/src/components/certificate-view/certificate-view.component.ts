import { Component, ChangeDetectionStrategy, input, output, computed, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Certificate, Student, ClassGroup } from '@services/code.service';

@Component({
  selector: 'app-certificate-view',
  templateUrl: './certificate-view.component.html',
  styleUrls: ['./certificate-view.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None, // Critical for global print styles
  host: {
    '(document:keydown.escape)': 'onClose()'
  }
})
export class CertificateViewComponent {
  certificate = input.required<Certificate>();
  student = input.required<Student>();
  classGroup = input.required<ClassGroup>();
  
  close = output<void>();

  totalHours = computed(() => {
    const lessons = this.classGroup().lessons;
    if (!lessons || lessons.length === 0) return 0;
    return lessons.reduce((total, lesson) => total + (lesson.standardDuration || 0), 0);
  });

  onPrint() {
    window.print();
  }

  onClose() {
    this.close.emit();
  }
}