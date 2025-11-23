
import { Injectable, signal, inject } from '@angular/core';
import { Certificate } from '../models/domain.models';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000';
  certificates = signal<Certificate[]>([]);

  constructor() {
    this.loadCertificates();
  }

  async loadCertificates() {
    try {
      const list = await this.http.get<Certificate[]>(`${this.baseUrl}/certificates`).toPromise();
      this.certificates.set(list || []);
    } catch (error) {
      console.error('Failed to load certificates', error);
      this.certificates.set([]);
    }
  }

  async issueCertificate(studentId: number, classId: number): Promise<Certificate> {
    // Create certificate via API
    const existing = this.certificates().find(c => c.studentId === studentId && c.classId === classId);
    if (existing) return existing;
    try {
      const payload = { studentId, classId };
      const created = await this.http.post<Certificate>(`${this.baseUrl}/certificates`, payload).toPromise();
      this.certificates.update(certs => [...certs, created]);
      return created;
    } catch (error) {
      console.error('Failed to issue certificate', error);
      throw error;
    }
  }

  getCertificate(studentId: number, classId: number): Certificate | undefined {
    return this.certificates().find(c => c.studentId === studentId && c.classId === classId);
  }

  getCertificatesForStudent(studentId: number): Certificate[] {
    return this.certificates().filter(c => c.studentId === studentId);
  }
}
