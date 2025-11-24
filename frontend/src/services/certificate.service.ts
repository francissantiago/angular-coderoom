
import { Injectable, signal, inject } from '@angular/core';
import { Certificate } from '../models/domain.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, retry, timer, tap, catchError, of } from 'rxjs';
import { HandleErrors } from './handle-errors.service';
import { AuthManager } from './auth-manager.service';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private headers = inject(AuthManager).headers;
  private api_retry_count = environment.apiMaxRetries || 3;
  private handlerErrors = inject(HandleErrors);

  certificates = signal<Certificate[]>([]);

  constructor() {
    this.loadCertificates();
  }

  /** Load initial certificates into the signal (used on constructor) */
  loadCertificates() {
    this.getAll().subscribe({
      next: (response) => this.certificates.set(response || []),
      error: (err) => {
        console.error('Failed to load certificates', err);
        this.certificates.set([]);
      },
    });
  }

  /** Return all certificates as observable */
  getAll(): Observable<Certificate[]> {
    return this.http
      .get<Certificate[]>(`${this.apiUrl}/certificates`, { headers: this.headers })
      .pipe(
        retry({
          count: this.api_retry_count,
          delay: (error, retryCount) => {
            if (error.status < 500) throw error;
            console.warn(`Tentativa ${retryCount} de recuperar certificados devido a erro:`, error);
            return timer(retryCount * 2000);
          },
        }),
        tap(() => {}),
        // Using centralized error handler to keep consistent behavior
        // and return friendly error messages
        catchError(this.handlerErrors.handleError)
      );
  }

  /** Issues a certificate and returns the created one */
  issueCertificate(studentId: number, classId: number): Observable<Certificate> {
    const existing = this.certificates().find((c) => c.studentId === studentId && c.classId === classId);
    if (existing) {
      return of(existing);
    }
    const payload = { studentId, classId };
    return this.http.post<Certificate>(`${this.apiUrl}/certificates`, payload, { headers: this.headers }).pipe(
      retry({
        count: this.api_retry_count,
        delay: (error, retryCount) => {
          if (error.status < 500) throw error;
          console.warn(`Tentativa ${retryCount} de emitir certificado devido a erro:`, error);
          return timer(retryCount * 2000);
        },
      }),
      tap((created) => this.certificates.update((c) => [...c, created])),
      catchError(this.handlerErrors.handleError)
    );
  }

  getCertificate(studentId: number, classId: number): Certificate | undefined {
    return this.certificates().find((c) => c.studentId === studentId && c.classId === classId);
  }

  getCertificatesForStudent(studentId: number): Certificate[] {
    return this.certificates().filter((c) => c.studentId === studentId);
  }
}
