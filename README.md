# PromptVault

PromptVault is my submission for the **Assignment - Associate Front-end Developer / The Prompt Nexus Challenge**. It is a full-stack library application for managing AI image-generation prompts using the required stack:

- **Frontend:** Angular
- **Backend:** Django
- **Database:** PostgreSQL
- **Cache:** Redis
- **DevOps:** Docker Compose

## Links

- **GitHub Repository:** [PromptVault](https://github.com/Asgarsk01/PromptVault)
- **Frontend (Live):** [https://lavish-respect-production.up.railway.app](https://lavish-respect-production.up.railway.app)
- **Backend API (Live):** [https://api.asgarassingment.online/api/prompts/](https://api.asgarassingment.online/api/prompts/)
- **Figma (View Only):** [PromptVault Figma](https://www.figma.com/design/cLQxjyzH02hSmmmxziSQnS/PromptVault?node-id=0-1&t=rAu52UB1wnHXc4Ew-1)

## What This Project Covers

### Core Requirements Implemented

- Prompt model with:
  - `id`
  - `title`
  - `content`
  - `complexity`
  - `created_at`
- `GET /prompts/` style listing support
- `POST /prompts/` prompt creation support
- `GET /prompts/:id/` prompt detail support
- Redis-backed `view_count` increment on prompt detail retrieval
- Angular prompt list view
- Angular prompt detail view
- Angular reactive prompt creation form with validation
- Docker Compose setup for frontend, backend, PostgreSQL, and Redis

### Bonus Features Implemented

- JWT authentication
- Signup, login, refresh token flow, and signout
- Login using **username or email**
- Protected prompt creation
- Tagging system with many-to-many prompt-tag relation
- Tag-based filtering
- Persistent likes and bookmarks
- Bookmarks page
- Search with backend filtering and debounced frontend behavior
- Pagination
- Analytics panel with tag-aware aggregation

## How To Navigate The App

The application is designed so the reviewer can understand the main flows quickly.

### 1. Login / Signup

- Open the frontend URL
- If you do not have an account, use the signup flow
- After signup, the app logs in and redirects to the dashboard
- If you already have an account, log in using either:
  - username + password
  - email + password

### 2. Dashboard

The dashboard is the primary browsing experience.

Here you can:

- browse prompts in a gallery layout
- use the trending tag filters
- search the prompt library
- switch sort/layout modes
- like prompts
- bookmark prompts
- open any prompt detail page

### 3. Prompt Detail Page

Selecting a prompt opens the detail screen where you can:

- read the full prompt content
- view tags
- view complexity
- view the live Redis-backed `view_count`

### 4. Add Prompt

Authenticated users can create prompts through the form flow:

- title validation: minimum 3 characters
- content validation: minimum 20 characters
- complexity validation: range 1-10
- tag selection support

### 5. Bookmarks

The bookmarks page shows the authenticated user’s saved prompts.

## Local Setup Instructions

### Run With Docker

From the project root:

```powershell
docker compose up --build -d
```

### Local URLs

- Frontend: [http://localhost:4200](http://localhost:4200)
- Backend API: [http://localhost:8000/api](http://localhost:8000/api)
- Django Admin: [http://localhost:8000/admin](http://localhost:8000/admin)

Development admin credentials:

- Username: `admin`
- Password: `admin123`

### Useful Commands

```powershell
docker compose ps
docker compose logs --tail=100
docker compose exec backend python manage.py migrate
docker compose exec backend python seed.py
docker compose down
```

## Architecture Overview

The project is split into a clean frontend/backend structure:

```text
PromptVault/
|-- backend/
|   |-- backend/
|   |-- prompts/
|   |-- manage.py
|   |-- requirements.txt
|   `-- seed.py
|-- frontend/
|   |-- src/
|   |-- Dockerfile
|   `-- nginx.conf
|-- docker-compose.yml
`-- README.md
```

## Frontend Architectural Choices

One of the key requirements in the submission was to explain the Angular organization clearly. I intentionally organized the Angular code around **screen responsibilities and application behavior**, rather than introducing too many abstract layers.

### Why I Organized Angular This Way

I used Angular standalone components and route-based composition because:

- each screen can remain focused and self-contained
- the route structure becomes easier to understand
- dependencies stay close to the component that uses them
- the application remains scalable without introducing unnecessary module complexity

### Angular Structure

The frontend is organized into these main parts:

- `components/`
- `services/`
- `models/`
- `guards/`
- `interceptors/`

### Component Layer

The major UI responsibilities are separated by feature:

- `prompt-list` handles dashboard browsing, filtering, pagination, bookmarks mode, and analytics integration
- `prompt-detail` handles the single-prompt page
- `prompt-form` handles prompt creation and validation flow
- `analytics-sidebar` handles summary metrics and tag interaction
- `top-nav` handles global search, user identity display, and signout
- `login` handles login, signup, and forgot-password UI

This keeps the application easy to reason about because each component maps directly to a user-facing feature.

### Service Layer

I placed API and auth logic in services so components stay focused on UI state instead of HTTP details.

- `prompt.service.ts` handles:
  - prompt listing
  - prompt detail
  - prompt creation
  - tags
  - likes
  - bookmarks
  - analytics
- `auth.service.ts` handles:
  - signup
  - login
  - token persistence
  - refresh flow
  - logout

This separation improves maintainability because request construction, API URLs, and session logic are centralized instead of duplicated across components.

### Guard and Interceptor Layer

- `auth.guard.ts` protects routes that require authentication, such as prompt creation and bookmarks
- `auth.interceptor.ts` attaches JWT access tokens and handles refresh/retry behavior on unauthorized requests

This allows authentication concerns to stay outside the components themselves.

### Why Reactive Forms

The prompt creation flow uses Angular Reactive Forms because the assignment explicitly required validation. Reactive forms made it straightforward to manage:

- field-level validation
- touched/dirty states
- multi-step form behavior
- server error mapping

That made the add-prompt flow easier to structure and easier to extend.

### Search and UI Performance

Search was deliberately implemented with debouncing and duplicate suppression so the frontend does not issue a request on every keystroke. This keeps the interaction smooth and reduces unnecessary backend calls.

## Backend Architectural Choices

The backend was kept intentionally direct and readable. Since the assignment emphasized a clean working solution, I preferred a focused Django structure over introducing unnecessary abstraction.

### Why Django Was Organized This Way

The backend centers around a single domain app: `prompts`.

I kept it this way because:

- the project domain is cohesive
- the feature set is centered on prompt management and related interactions
- splitting into too many apps would add ceremony without improving readability

### Backend Structure

- `models.py` defines the prompt, tag, like, and bookmark relationships
- `views.py` contains endpoint logic, validation, auth-related API behavior, and analytics computation
- `urls.py` maps the API routes
- `admin.py` exposes data models in Django admin
- `seed.py` provides repeatable prompt data for testing and demonstration

### Data Model

Core entities:

- `Prompt`
- `Tag`
- `PromptLike`
- `PromptBookmark`

This model structure keeps the core prompt entity simple while storing user-specific engagement separately.

### API and Logic Decisions

Key backend choices:

- PostgreSQL is the durable source of truth for prompt and relationship data
- Redis is the source of truth for prompt `view_count`
- JWT is used to protect write operations
- prompt search is handled server-side across title, content, and tags
- pagination is handled server-side
- analytics are computed on the backend so the frontend receives ready-to-use metrics

### Redis View Counter

The assignment specifically required Redis-backed prompt views without writing to PostgreSQL on every read. This is implemented by incrementing Redis every time a prompt detail endpoint is requested, and returning the current `view_count` in the JSON response.

### Validation Strategy

Validation is implemented close to the endpoint logic so the business rules remain explicit:

- prompt title minimum length
- prompt content minimum length
- complexity range validation
- curated tag validation
- signup uniqueness validation for username and email
- login support for username or email

## Feature Summary

### Prompt Features

- list prompts
- view prompt details
- create prompts
- view complexity visually
- view Redis-backed view count

### Discovery Features

- tag filtering
- search
- curated trending tags
- pagination

### User Features

- signup
- login
- logout
- likes
- bookmarks
- bookmarks page

### Analytics Features

- trending percentage
- most viewed concentration
- most liked concentration
- saved prompts count

## Seed Data

The project includes seeded prompt data so the reviewer can test the product with realistic content instead of placeholder records.

To seed locally:

```powershell
docker compose exec backend python seed.py
```

## Deployment Notes

The project also includes Railway-oriented production preparation:

- backend `railway.json`
- frontend `railway.json`
- production environment file
- Gunicorn-based backend startup
- static/media settings
- Railway-compatible CORS configuration

## Final Note

My aim with this submission was to build a solution that is not only complete against the assignment checklist, but also clear, maintainable, and easy to evaluate. I focused on keeping the Angular code organized around feature responsibilities, keeping the Django backend readable and explicit, and delivering a polished end-to-end product with Dockerized local setup and deployable production structure.
