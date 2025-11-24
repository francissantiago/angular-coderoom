
import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { User } from '../models/domain.models';
import { AuthManager } from './auth-manager.service';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Observable, of, catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private authManager = inject(AuthManager);
  
  // Current authenticated user state
  currentUser = signal<User | null>(null);

  constructor() {
    // Check for existing token on init
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        this.currentUser.set({
          id: decoded.sub,
          name: decoded.name || 'User', // Assuming name is in token, adjust as needed
          email: decoded.email,
          role: decoded.role
        });
      } catch (error) {
        console.error('Invalid token', error);
        localStorage.removeItem('access_token');
      }
    }
  }

  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password }).pipe(
      map((response) => {
        if (response && response.access_token) {
          try {
            localStorage.setItem('access_token', response.access_token);
            this.authManager.token = response.access_token;
            const decoded: any = jwtDecode(response.access_token);
            this.currentUser.set({
              id: decoded.sub,
              name: decoded.name || 'User',
              email: decoded.email,
              role: decoded.role,
            });
            return true;
          } catch (e) {
            console.error('Login decode failed', e);
            return false;
          }
        }
        return false;
      }),
      catchError((err) => {
        console.error('Login failed', err);
        return of(false);
      })
    );
  }

  logout() {
    localStorage.removeItem('access_token');
    this.authManager.token = null;
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  getUserRole(): 'student' | 'teacher' | null {
    return this.currentUser()?.role || null;
  }
}
