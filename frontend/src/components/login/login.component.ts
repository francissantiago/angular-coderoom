
import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  authService = inject(AuthService);

  email = signal('');
  password = signal('');
  selectedRole = signal<'student' | 'teacher'>('student');
  errorMessage = signal('');

  // Mock hints for demo purposes
  availableStudents = inject(AuthService)['studentService'].students;

  onEmailChange(event: Event) {
    this.email.set((event.target as HTMLInputElement).value);
    this.errorMessage.set('');
  }

  onPasswordChange(event: Event) {
    this.password.set((event.target as HTMLInputElement).value);
    this.errorMessage.set('');
  }

  setRole(role: 'student' | 'teacher') {
    this.selectedRole.set(role);
    this.errorMessage.set('');
    this.password.set(''); // Clear password on role switch
    
    // Clear email or pre-fill for convenience during demo
    if (role === 'teacher') {
        this.email.set('professor@coderoom.com');
        this.password.set('admin123'); // Pre-fill for demo convenience
    } else {
        this.email.set('');
    }
  }

  login() {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Por favor, preencha e-mail e senha.');
      return;
    }

    const success = this.authService.login(this.email(), this.password(), this.selectedRole());
    
    if (!success) {
      this.errorMessage.set('Credenciais inválidas. Verifique e-mail e senha.');
    }
  }
  
  // Helper to quick fill student for testing
  fillStudent(email: string) {
      this.email.set(email);
      this.password.set('123'); // Default mock password
  }
}
