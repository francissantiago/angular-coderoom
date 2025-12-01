# Sequelize Migrations & Seeders

Documentação centralizada para todas as migrations e seeders do banco de dados.

## 📁 Estrutura

```
backend/sequelize/
├── config/
│   └── config.js              # Configuração de conexão (dev, test, prod)
├── migrations/                 # Arquivos de schema (01-11)
│   ├── 20251129-create-*.js   # Criação de tabelas principais
│   └── *.js                    # Alterações e correções de schema
└── seeders/                    # Dados iniciais e históricos
    ├── 20251129-create-admin-user.js           # ✅ Ativo
    ├── legacy-20251129-migrate-students-*.js   # ⚠️ Dados históricos (skip em novo setup)
    └── legacy-20251129-populate-lessons-*.js   # ⚠️ Dados históricos (skip em novo setup)
```

## 📊 Diagrama ER

```
┌─────────────┐
│   users     │
├─────────────┤
│ id (PK)     │
│ name        │
│ email       │ ─────┐
│ role        │      │ (1:N)
│ password    │      │
└─────────────┘      │
                     ├─────────────────────┐
                     │                     │
               ┌─────────────┐      ┌──────────────┐
               │  students   │      │ class_groups │
               ├─────────────┤      ├──────────────┤
               │ id (PK)     │      │ id (PK)      │
               │ name        │      │ name         │
               │ email       │      │ description  │
               │ enrollmentNo│      │ schedule     │
               │ birthDate   │      └──────────────┘
               │ password    │            ▲
               └─────────────┘            │ (1:N)
                     ▲                    │
                     │ (N:M)              │
                     │              ┌─────────────────────────┐
            ┌────────┴─────────┐    │ class_group_students    │
            │                  │    ├─────────────────────────┤
            │                  │    │ class_group_id (FK)     │
            │                  │    │ student_id (FK)         │
            │                  │    │ PK: (class_group_id,    │
            │                  │    │      student_id)        │
            │                  │    │ UQ: uniq_class_group_st │
            │                  │    └─────────────────────────┘
            │                  │
    ┌───────────┐    ┌──────────────────┐
    │ lessons   │    │ class_sessions   │
    ├───────────┤    ├──────────────────┤
    │ id (PK)   │    │ id (PK)          │
    │ title     │    │ title            │
    │ descript. │    │ date             │
    │ duration  │    │ class_group_id   │◄─────┐
    │ cg_id     │───►│ lesson_id        │◄─────┤
    └───────────┘    └──────────────────┘      │
         ▲                    │                 │
         │                    │ (1:N)      (1:N)
         │                    │                 │
         └────────────────────┴────────┐        │
                                       │        │
                              ┌────────────────┐│
                              │  attendances   ││
                              ├────────────────┤│
                              │ id (PK)        ││
                              │ session_id (FK)│
                              │ student_id (FK)│
                              │ status         │
                              └────────────────┘
                                       ▲
                                       │
                              ┌──────────────────┐
                              │  certificates    │
                              ├──────────────────┤
                              │ id (PK)          │
                              │ studentId (FK)   │
                              │ class_group_id   │
                              │ issueDate        │
                              │ validationCode   │
                              └──────────────────┘
                                       ▲
                                       │
                              ┌──────────────────┐
                              │  projects        │
                              ├──────────────────┤
                              │ id (PK)          │
                              │ title            │
                              │ description      │
                              │ class_group_id   │
                              └──────────────────┘
```

## 🔄 Ordem de Execução de Migrations

**Sequência garantida (dependências de FK):**

1. ✅ `20251129-create-users.js` — Base independente
2. ✅ `20251129-create-students.js` — Base independente
3. ✅ `20251129-create-class-groups.js` — Base independente
4. ✅ `20251129-create-class_group_students.js` — Depende de: class_groups, students
5. ✅ `20251129-create-lessons.js` — Depende de: class_groups
6. ✅ `20251129-create-certificates.js` — Depende de: students, class_groups (NEW)
7. ✅ `20251129-create-projects.js` — Depende de: class_groups
8. ✅ `20251129-create-class-sessions.js` — Depende de: class_groups, lessons
9. ✅ `20251129-create-attendances.js` — Depende de: class_sessions, students
10. ⚠️ `20251129-add-class-group-id-to-certificates.js` — Cleanup/idempotente (merged em create-certificates)
11. ⚠️ `20251129-correct-column-names-and-cleanup-fks.js` — Dados históricos apenas (skip em novo setup)

## 🌱 Ordem de Execução de Seeders

**Seeders ativos (executados por padrão):**

1. ✅ `20251129-create-admin-user.js` — Usuário admin (obrigatório)

**Seeders de dados históricos (skip em novo setup):**

- ⚠️ `legacy-20251129-migrate-students-to-class_group_students.js`
- ⚠️ `legacy-20251129-populate-lessons-classgroupid.js`

## 📋 Scripts NPM

```bash
# Validar ordem e dependências de migrations
npm run db:validate

# Limpar banco de dados completamente (drop + create)
npm run db:clean

# Executar todas as migrations (com validação)
npm run db:migrate

# Desfazer última migration
npm run db:migrate:undo

# Executar seeders ativos (não-legacy)
npm run db:seed

# Executar ALL seeders (ativo + legacy)
npm run db:seed:legacy

# Setup completo (migrations + seeders ativos)
npm run db:init

# Reset completo (clean + init)
npm run db:reset
```

## 🌱 Controle de Seeders Legacy

Seeders com prefixo `legacy-` são **DESABILITADOS por padrão** e executados apenas quando solicitado explicitamente.

### Para novo setup (padrão):
```bash
npm run db:reset
# Apenas admin user é criado
```

### Para migração de dados legados:
```bash
SEED_LEGACY_DATA=true npm run db:seed:legacy
# ou
npm run db:seed:legacy
```

## 🔐 Variáveis de Ambiente

```env
# .env ou .env.development
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=coderoom_db

# Opcional: skipear seeders legacy em novo setup
SEED_LEGACY_DATA=false
```

## ⚠️ Dados Históricos

Seeders marcados com prefixo `legacy-` contêm lógica de migração de dados antigos e **NÃO devem ser executados em novas instâncias**.

### Para novo setup:
```bash
# Executar apenas migration + seed admin
npm run db:reset
```

### Para migração de dados legados:
```bash
# Executar seeders legacy manualmente se necessário
npm run db:seed:legacy
# ou com variável de ambiente
SEED_LEGACY_DATA=true npm run db:seed
```

### Arquivo de configuração
Criar `.env.local` para override:
```env
# Usar true apenas em ambiente de migração
SEED_LEGACY_DATA=false
```

## 📝 Padrão de Nomenclatura

- **Migrations**: `YYYYMMdd-{description}.js` (ex: `20251129-create-users.js`)
- **Seeders**: `YYYYMMdd-{description}.js` ou `legacy-YYYYMMdd-{description}.js`
- **Nomes de tabelas**: `snake_case` (ex: `class_groups`, `class_group_students`)
- **Nomes de colunas**: `snake_case` (ex: `class_group_id`, `createdAt`)

## 🛠️ Troubleshooting

### Erro: "Table doesn't exist"
- Verificar ordem de execução: `npm run db:validate`
- Confirmar que migrations anteriores foram executadas

### Erro: "Foreign key constraint fails"
- Verificar tipos de dados (INT vs BIGINT)
- Confirmar que tabela referenciada foi criada
- Rodar migration in isolation: `npx sequelize-cli db:migrate --to 20251129-create-lessons.js`

### Reset de database
```bash
# Opção 1: Via npm
npm run db:reset

# Opção 2: Manual (MySQL CLI)
DROP DATABASE coderoom_db;
CREATE DATABASE coderoom_db;
npm run db:init
```

## 📚 Referências

- [Sequelize Docs](https://sequelize.org/)
- [Sequelize CLI](https://github.com/sequelize/cli)
- Configuração: `backend/sequelize/config/config.js`
- Models: `backend/src/models/*.model.ts`
