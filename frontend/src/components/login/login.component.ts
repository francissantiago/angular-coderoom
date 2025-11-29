
import { Component, ChangeDetectionStrategy, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@services/auth.service';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnDestroy {
  authService = inject(AuthService);
  private destroyed = new Subject<void>();

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

  login() {
    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Por favor, preencha e-mail e senha.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService
      .login(this.email(), this.password())
      .pipe(takeUntil(this.destroyed), finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (success) => {
          if (!success) {
            this.errorMessage.set('Credenciais inválidas. Verifique e-mail e senha.');
          }
        },
        error: () => {
          this.errorMessage.set('Erro ao fazer login. Tente novamente.');
        },
      });
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }
}
