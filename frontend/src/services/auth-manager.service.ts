import { HttpHeaders } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthManager {
  public test_token = signal<string | null>(null);

  private readonly DEV_HARDCODED_TOKEN = environment.devHardcodedToken || '';

  get headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token ?? ''}`,
    });
  }

  get token(): string | null {
    const current = this.test_token();
    if (!environment.production && (!current || current === '')) {
      return this.DEV_HARDCODED_TOKEN || localStorage.getItem('access_token') || null;
    }
    return current || localStorage.getItem('access_token');
  }

  set token(value: string | null) {
    this.test_token.set(value);
  }
}
