
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
  errorMessage = signal('');
  isLoading = signal(false);

  onEmailChange(event: Event) {
    this.email.set((event.target as HTMLInputElement).value);
    this.errorMessage.set('');
  }

  onPasswordChange(event: Event) {
    this.password.set((event.target as HTMLInputElement).value);
    this.errorMessage.set('');
  }

  async login() {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Por favor, preencha e-mail e senha.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const success = await this.authService.login(this.email(), this.password());
      if (!success) {
        this.errorMessage.set('Credenciais inválidas. Verifique e-mail e senha.');
      }
    } catch (error) {
      this.errorMessage.set('Erro ao fazer login. Tente novamente.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
