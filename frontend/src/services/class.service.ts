
import { Injectable, signal } from '@angular/core';
import { ClassGroup, Lesson } from '../models/domain.models';

const MOCK_CLASS_GROUPS: ClassGroup[] = [
  { 
    id: 1, 
    name: 'Turma 101 - Fundamentos Web', 
    description: 'Introdução ao desenvolvimento web.',
    schedule: 'Sábados 15:00 - 16:00',
    studentIds: [1, 3],
    lessons: [
      { id: 1, title: 'Aula 01 - Introdução HTML', description: 'Tags, atributos e estrutura.', standardDuration: 1 },
      { id: 2, title: 'Aula 02 - Básico de CSS', description: 'Seletores e Cores.', standardDuration: 1 },
      { id: 3, title: 'Aula 03 - Box Model', description: 'Margem, preenchimento, borda.', standardDuration: 1 }
    ]
  },
  { 
    id: 2, 
    name: 'Turma 102 - CSS Avançado', 
    description: 'Técnicas avançadas de estilização.',
    schedule: 'Segundas 12:00 - 13:00',
    studentIds: [2, 4],
    lessons: [
      { id: 1, title: 'Aula 01 - Flexbox', description: 'Mecânicas de Layout.', standardDuration: 1 },
      { id: 2, title: 'Aula 02 - Grid', description: 'Layouts 2D.', standardDuration: 1 }
    ]
  },
];

@Injectable({
  providedIn: 'root',
})
export class ClassService {
  classGroups = signal<ClassGroup[]>(MOCK_CLASS_GROUPS);

  addNewClassGroup(name: string, description: string, schedule: string, studentIds: number[]) {
    this.classGroups.update(groups => {
      const newId = groups.length > 0 ? Math.max(...groups.map(g => g.id)) + 1 : 1;
      const newGroup: ClassGroup = { 
        id: newId, 
        name, 
        description,
        schedule,
        studentIds, 
        lessons: [] 
      };
      return [...groups, newGroup];
    });
  }

  updateClassGroup(classId: number, name: string, description: string, schedule: string, studentIds: number[]) {
    this.classGroups.update(groups => 
      groups.map(g => g.id === classId ? { ...g, name, description, schedule, studentIds } : g)
    );
  }

  removeStudentFromClasses(studentId: number) {
    this.classGroups.update(groups =>
      groups.map(g => ({
        ...g,
        studentIds: g.studentIds.filter(id => id !== studentId)
      }))
    );
  }

  addLessonToClass(classId: number, lessonData: Omit<Lesson, 'id'>) {
    this.classGroups.update(groups => 
      groups.map(g => {
        if (g.id === classId) {
          const nextId = g.lessons.length > 0 ? Math.max(...g.lessons.map(m => m.id)) + 1 : 1;
          const newLesson: Lesson = { ...lessonData, id: nextId };
          return { ...g, lessons: [...g.lessons, newLesson] };
        }
        return g;
      })
    );
  }

  updateLessonInClass(classId: number, lesson: Lesson) {
    this.classGroups.update(groups => 
        groups.map(g => {
          if (g.id === classId) {
            return { 
              ...g, 
              lessons: g.lessons.map(m => m.id === lesson.id ? lesson : m) 
            };
          }
          return g;
        })
      );
  }

  removeLessonFromClass(classId: number, lessonId: number) {
    this.classGroups.update(groups => 
        groups.map(g => {
          if (g.id === classId) {
            return { 
              ...g, 
              lessons: g.lessons.filter(m => m.id !== lessonId) 
            };
          }
          return g;
        })
      );
  }
}
