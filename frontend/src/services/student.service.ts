
import { Injectable, signal } from '@angular/core';
import { Student } from '../models/domain.models';

const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Alex Doe', email: 'alex.doe@school.edu', enrollmentNumber: '2023-001', birthDate: '2008-05-15', password: '123' },
  { id: 2, name: 'Jane Smith', email: 'jane.smith@school.edu', enrollmentNumber: '2023-002', birthDate: '2008-08-22', password: '123' },
  { id: 3, name: 'Peter Jones', email: 'peter.jones@school.edu', enrollmentNumber: '2023-003', birthDate: '2007-11-30', password: '123' },
  { id: 4, name: 'Maria Garcia', email: 'maria.garcia@school.edu', enrollmentNumber: '2023-004', birthDate: '2009-01-10', password: '123' },
];

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  students = signal<Student[]>(MOCK_STUDENTS);

  addStudent(data: { name: string; email: string; enrollmentNumber: string; birthDate: string }) {
    this.students.update(students => {
      const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
      // Set default password for new students
      return [...students, { id: newId, ...data, password: '123' }];
    });
  }

  removeStudent(studentId: number) {
    this.students.update(students => students.filter(s => s.id !== studentId));
  }

  getStudentById(id: number): Student | undefined {
    return this.students().find(s => s.id === id);
  }
}
