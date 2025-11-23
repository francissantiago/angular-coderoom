
export interface CodeState {
  html: string;
  css: string;
  js: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  enrollmentNumber: string;
  birthDate: string; // Format: YYYY-MM-DD
  password?: string; // Added password field
}

export interface StudentSubmission {
  studentId: number;
  studentName: string;
  code: CodeState;
  lastSaved: Date | null;
  grade?: number;
  feedback?: string;
}

export interface Project {
  id: number;
  classId: number;
  name: string;
  description: string;
  teacherCode: CodeState;
  studentSubmissions: StudentSubmission[];
}

// "Aula Planejada" - The content definition
export interface Lesson {
  id: number;
  title: string; // e.g., "Aula 01 - Introdução"
  description: string;
  standardDuration: number; // in hours, e.g., 1
}

// "Diário de Classe / Aula Dada" - The execution
export interface ClassSession {
  id: number;
  classId: number;
  date: string; // YYYY-MM-DD
  lessonId: number; // Link to the content applied
  observation?: string; // Teacher notes for that specific day
  presentStudentIds: number[]; // Attendance for this specific session
}

export interface ClassGroup {
  id: number;
  name: string;
  description: string;
  schedule: string; // e.g., "Segundas 15:00 - 16:00"
  studentIds: number[];
  lessons: Lesson[]; // The planned curriculum
}

export interface Certificate {
  id: string; // UUID-like string
  studentId: number;
  classId: number;
  issueDate: string;
  validationCode: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher';
}
