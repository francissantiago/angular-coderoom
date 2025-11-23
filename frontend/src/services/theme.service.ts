
import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  // Default to dark to match original design
  currentTheme = signal<'light' | 'dark'>('dark');

  constructor() {
    // Load from storage or default
    const saved = localStorage.getItem('theme') as 'light' | 'dark';
    if (saved) {
      this.currentTheme.set(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      this.currentTheme.set('light');
    }

    // Apply theme whenever signal changes
    effect(() => {
      const theme = this.currentTheme();
      const html = document.documentElement;
      
      if (theme === 'dark') {
        html.classList.add('dark');
      } else {
        html.classList.remove('dark');
      }
      
      localStorage.setItem('theme', theme);
    });
  }

  toggleTheme() {
    this.currentTheme.update(current => current === 'dark' ? 'light' : 'dark');
  }
}
