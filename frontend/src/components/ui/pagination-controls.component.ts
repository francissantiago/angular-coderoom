
import { Component, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination-controls',
  imports: [CommonModule],
  templateUrl: './pagination-controls.component.html',
  styleUrls: ['./pagination-controls.component.scss'],
})
export class PaginationControlsComponent {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  pageSize = input.required<number>();
  totalItems = input.required<number>();
  
  pageChange = output<number>();

  startItem = computed(() => (this.currentPage() - 1) * this.pageSize() + 1);
  
  endItem = computed(() => Math.min(this.currentPage() * this.pageSize(), this.totalItems()));

  changePage(page: number) {
    this.pageChange.emit(page);
  }
}
