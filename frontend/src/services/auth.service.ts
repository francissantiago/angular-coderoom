
import { Injectable, signal, inject } from '@angular/core';
import { User } from '../models/domain.models';
import { StudentService } from './student.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private studentService = inject(StudentService);
  
  // Current authenticated user state
  currentUser = signal<User | null>(null);

  login(email: string, password: string, role: 'student' | 'teacher'): boolean {
    if (role === 'teacher') {
      // Mock Teacher Credentials
      // In a real app, this would be a backend call
      const validEmails = ['professor@coderoom.com', 'admin@coderoom.com'];
      if (validEmails.includes(email) && password === 'admin123') {
        this.currentUser.set({
          id: 999,
          name: 'Professor Admin',
          email: email,
          role: 'teacher'
        });
        return true;
      }
    } else {
      // Find student by email
      const student = this.studentService.students().find(s => s.email.toLowerCase() === email.toLowerCase());
      
      // Check if student exists AND password matches
      // For backward compatibility with existing mocks lacking passwords, we fallback to '123456' check logic if undefined
      if (student) {
          const studentPass = student.password || '123'; 
          if (studentPass === password) {
            this.currentUser.set({
              id: student.id,
              name: student.name,
              email: student.email,
              role: 'student'
            });
            return true;
          }
      }
    }
    
    return false;
  }

  logout() {
    this.currentUser.set(null);
  }

  isLoggedIn() {
    return this.currentUser() !== null;
  }

  getUserRole(): 'student' | 'teacher' | null {
    return this.currentUser()?.role ?? null;
  }
}
