
import { Injectable, signal, inject } from '@angular/core';
import { Project, Student } from '../models/domain.models';
import { StudentService } from './student.service';

const MOCK_PROJECTS: Project[] = [
  {
    id: 1,
    classId: 1,
    name: 'Fundamentos de HTML e CSS',
    description: 'Crie um cartão de perfil simples usando HTML Semântico e Flexbox. Garanta que o cartão seja responsivo e fique bom em dispositivos móveis.',
    teacherCode: {
      html: `<!-- Código HTML do Professor -->
<div class="container">
  <h1>Olá, Aluno!</h1>
  <p>Replique este design.</p>
</div>`,
      css: `/* Código CSS do Professor */
body {
  background-color: #f0f0f0;
  color: #333;
  font-family: sans-serif;
  text-align: center;
}

.container {
  padding: 2rem;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  margin: 2rem;
}`,
      js: `// Código JavaScript do Professor
console.log('Script do Professor carregado.');`
    },
    studentSubmissions: [
      {
        studentId: 1,
        studentName: 'Alex Doe',
        lastSaved: new Date(),
        grade: 90,
        feedback: 'Excelente trabalho! A estrutura do seu código está limpa e responsiva.',
        code: {
          html: `<!-- Código HTML de Alex -->
<div class="card">
  <h2>Bem-vindo à Aula!</h2>
  <p>Comece a codificar aqui. Suas alterações aparecerão na visualização ao lado.</p>
  <button id="myButton">Clique em Mim</button>
</div>`,
          css: `/* Código CSS de Alex */
.card {
  background: #fff;
  border: 1px solid #ddd;
  padding: 20px;
  margin: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}`,
          js: `// Código JavaScript de Alex
console.log('Script do Aluno carregado.');

const button = document.getElementById('myButton');
button.addEventListener('click', () => {
  alert('Ótimo trabalho clicando no botão!');
});`
        }
      }
    ]
  }
];

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  projects = signal<Project[]>(MOCK_PROJECTS);
  private studentService = inject(StudentService);

  createNewProject(classId: number, name: string, description: string) {
    this.projects.update(projects => {
        const newProjectId = projects.length > 0 ? Math.max(...projects.map(p => p.id)) + 1 : 1;
        const newProject: Project = {
            id: newProjectId,
            classId: classId,
            name: name,
            description: description,
            teacherCode: {
                html: '<h1>Novo Projeto</h1>',
                css: 'body { background: #eee; }',
                js: 'console.log("Comece aqui!");'
            },
            studentSubmissions: [] 
        };
        return [...projects, newProject];
    });
  }

  updateProjectDetails(id: number, name: string, description: string) {
    this.projects.update(projects => 
      projects.map(p => p.id === id ? { ...p, name, description } : p)
    );
  }

  updateProjectAssignments(projectId: number, assignedStudentIds: number[]) {
    const allStudents = this.studentService.students();

    this.projects.update(projects => {
      return projects.map(p => {
        if (p.id === projectId) {
          // Filter out submissions for unassigned students
          let updatedSubmissions = p.studentSubmissions.filter(s => 
            assignedStudentIds.includes(s.studentId)
          );

          // Add new submissions for newly assigned students
          assignedStudentIds.forEach(studentId => {
            const submissionExists = updatedSubmissions.some(s => s.studentId === studentId);
            if (!submissionExists) {
              const student = allStudents.find(s => s.id === studentId);
              if (student) {
                updatedSubmissions.push({
                  studentId: student.id,
                  studentName: student.name,
                  lastSaved: null,
                  code: {
                    html: `<!-- Comece a codificar aqui, ${student.name}! -->\n<h1>Bem-vindo</h1>`,
                    css: `/* Seu CSS vai aqui */\nbody {\n  font-family: sans-serif;\n}`,
                    js: `// Seu JavaScript vai aqui\nconsole.log('Olá, ${student.name}!');`
                  }
                });
              }
            }
          });
          
          return { ...p, studentSubmissions: updatedSubmissions };
        }
        return p;
      });
    });
  }

  updateStudentCode(projectId: number, studentId: number, language: 'html' | 'css' | 'js', content: string) {
    this.projects.update(projects => {
      return projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            studentSubmissions: p.studentSubmissions.map(s => {
              if (s.studentId === studentId) {
                return {
                  ...s,
                  code: { ...s.code, [language]: content }
                };
              }
              return s;
            })
          };
        }
        return p;
      });
    });
  }

  saveCodeTimestamp(projectId: number, studentId: number) {
     this.projects.update(projects => {
      return projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            studentSubmissions: p.studentSubmissions.map(s => {
              if (s.studentId === studentId) {
                return { ...s, lastSaved: new Date() };
              }
              return s;
            })
          };
        }
        return p;
      });
    });
  }

  gradeStudentSubmission(projectId: number, studentId: number, grade: number, feedback: string) {
    this.projects.update(projects =>
      projects.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            studentSubmissions: p.studentSubmissions.map(s => {
              if (s.studentId === studentId) {
                return { ...s, grade, feedback };
              }
              return s;
            })
          };
        }
        return p;
      })
    );
  }

  removeStudentSubmissions(studentId: number) {
    this.projects.update(projects =>
      projects.map(p => ({
        ...p,
        studentSubmissions: p.studentSubmissions.filter(s => s.studentId !== studentId)
      }))
    );
  }
}
