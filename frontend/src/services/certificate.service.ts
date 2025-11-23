
import { Injectable, signal } from '@angular/core';
import { Certificate } from '../models/domain.models';

@Injectable({
  providedIn: 'root',
})
export class CertificateService {
  certificates = signal<Certificate[]>([]);

  issueCertificate(studentId: number, classId: number): Certificate {
    // Check if already exists
    const existing = this.certificates().find(c => c.studentId === studentId && c.classId === classId);
    if (existing) return existing;

    const newCert: Certificate = {
      id: crypto.randomUUID(),
      studentId,
      classId,
      issueDate: new Date().toISOString(),
      validationCode: Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    this.certificates.update(certs => [...certs, newCert]);
    return newCert;
  }

  getCertificate(studentId: number, classId: number): Certificate | undefined {
    return this.certificates().find(c => c.studentId === studentId && c.classId === classId);
  }

  getCertificatesForStudent(studentId: number): Certificate[] {
    return this.certificates().filter(c => c.studentId === studentId);
  }
}
