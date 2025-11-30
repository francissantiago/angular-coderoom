# Angular CodeRoom - AI Coding Agent Instructions

## Architecture Overview
This is a full-stack coding classroom application with Angular frontend and NestJS backend.

**Frontend (Angular 20):**
- Standalone components with zoneless change detection (`provideZonelessChangeDetection()`)
- Signals-based state management (no NgRx, use Angular signals and computed properties)
- TailwindCSS for styling
- Vite-based build system (`@angular/build:application`)
- Path mappings: `@components/*`, `@services/*`, `@utils/*`, etc. from `./src`
- Entry point: `index.tsx` (standalone bootstrap with `provideHttpClient()`)

**Backend (NestJS):**
- Sequelize ORM with MySQL 8
- Docker Compose for database setup
- JWT authentication
- RESTful API structure

**Data Flow:**
- Services manage state with signals (e.g., `AuthService.currentUser`, `CodeService.assignedProjectsForCurrentUser`)
- Components use `inject()` for DI, `computed()` for derived state, `output()` for events
- Mock data in services until backend integration

## Key Components & Patterns
- **Dashboards:** `StudentDashboardComponent`, `TeacherDashboardComponent` - role-based views with computed stats
- **Modals:** Dedicated components for CRUD (e.g., `AssignmentModalComponent`, `ClassModalComponent`)
- **Editor/Preview:** Live code editing with `CodeService` managing HTML/CSS/JS state
- **Models:** Defined in `domain.models.ts` (Student, Project, ClassSession, etc.)
- **Services:** Injectable singletons (e.g., `AuthService`, `CodeService`) - prefer signals over BehaviorSubjects

## Developer Workflows
- **Start dev server:** `npm run dev` (ng serve)
- **Build:** `npm run build` (ng build)
- **Preview production:** `npm run preview` (ng serve --configuration=production)
- **Backend setup:** Follow `backend/BACKEND_INSTRUCTIONS.md` - Docker Compose for MySQL, NestJS CLI for scaffolding
- **Debugging:** Standard Angular DevTools; check signals in components for state issues
- **No tests configured yet** - add Jest/Karma if needed

## Conventions & Patterns
- **Component structure:** `.component.ts`, `.component.html`, `.component.scss` - OnPush CD, imports in component decorator
- **Styling:** Tailwind classes in templates; custom SCSS in `.component.scss`
- **State management:** Signals for local/component state, services for shared state
- **Authentication:** Mock in `AuthService.login()` - teacher emails: `professor@coderoom.com`, `admin@coderoom.com` (pass: `admin123`); students via `StudentService`
- **File naming:** Kebab-case for components (e.g., `student-dashboard`), camelCase for services/models
- **Imports:** Use path mappings (e.g., `import { CodeService } from '@services/code.service';`)
- **Change detection:** Zoneless - effects run automatically on signal changes

## Integration Points
- **Backend API:** Not yet implemented - services have mock data; plan for HTTP calls in services
- **External deps:** RxJS for observables (if needed), but prefer signals
- **Cross-component:** Use `output()` for child-to-parent events; inject services for shared data

Reference: `README.md`, `frontend/package.json`, `backend/BACKEND_INSTRUCTIONS.md`</content>
<parameter name="filePath">d:\Documentos\GitHub\angular-coderoom\.github\copilot-instructions.md