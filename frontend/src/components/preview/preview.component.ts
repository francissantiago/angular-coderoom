
import { Component, ChangeDetectionStrategy, input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-preview',
  standalone: true,
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewComponent {
  document = input.required<string>();
  // FIX: Explicitly typing `sanitizer` to resolve a type inference issue where it was being treated as `unknown`.
  private sanitizer: DomSanitizer = inject(DomSanitizer);

  safeDocument = computed<SafeHtml>(() => {
    return this.sanitizer.bypassSecurityTrustHtml(this.document());
  });
}
