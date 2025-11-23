
import { signal, computed, Signal, WritableSignal } from '@angular/core';

export type SortDirection = 'asc' | 'desc' | '';

export class TableState<T> {
  // Input: The raw data source
  source: WritableSignal<T[]> = signal([]);
  
  // State Configs
  searchQuery = signal('');
  pageIndex = signal(1);
  pageSize = signal(10);
  sortColumn = signal<keyof T | ''>('');
  sortDirection = signal<SortDirection>('');

  // --- Computed Results ---

  // 1. Filtered Data
  filteredData = computed(() => {
    const data = this.source();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return data;

    return data.filter(item => {
      // Generic search: checks all string/number properties of the object
      return Object.values(item as any).some(val => 
        String(val).toLowerCase().includes(query)
      );
    });
  });

  // 2. Sorted Data (derived from Filtered)
  sortedData = computed(() => {
    const data = [...this.filteredData()];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    if (!col || !dir) return data;

    return data.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];

      if (typeof valA === 'string' && typeof valB === 'string') {
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  // 3. Paginated Data (derived from Sorted)
  paginatedData = computed(() => {
    const data = this.sortedData();
    const page = this.pageIndex();
    const size = this.pageSize();
    
    const startIndex = (page - 1) * size;
    return data.slice(startIndex, startIndex + size);
  });

  // Metadata
  totalItems = computed(() => this.filteredData().length);
  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  // --- Actions ---

  setSource(data: T[]) {
    this.source.set(data);
    // Reset to page 1 if data changes drastically, optional
  }

  setSearch(query: string) {
    this.searchQuery.set(query);
    this.pageIndex.set(1); // Reset to first page on search
  }

  setSort(column: keyof T) {
    const currentDir = this.sortDirection();
    const currentCol = this.sortColumn();

    if (currentCol === column) {
      // Toggle direction: asc -> desc -> none
      if (currentDir === 'asc') this.sortDirection.set('desc');
      else if (currentDir === 'desc') {
        this.sortDirection.set('');
        this.sortColumn.set('');
      } else {
        this.sortDirection.set('asc');
      }
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  setPage(page: number) {
    const max = this.totalPages();
    if (page >= 1 && page <= max) {
      this.pageIndex.set(page);
    }
  }
  
  setPageSize(size: number) {
      this.pageSize.set(size);
      this.pageIndex.set(1);
  }
}
