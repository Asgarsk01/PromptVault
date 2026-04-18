# PromptVault Full Deep Dive

This document explains the PromptVault project in detail.

It is written for a frontend developer who is comfortable with Node.js and React, but new to:

- Django
- Angular
- Docker
- PostgreSQL
- Redis

It also documents what was actually done across all phases of this project, including:

- every important command
- every generated folder
- every important config file
- development credentials and ports
- why each technology is present
- the runtime issues encountered and how they were fixed

This is not just a summary. It is meant to be a study guide for the exact codebase sitting in this folder.

---

# 1. What PromptVault Is

PromptVault is a full-stack web application for managing AI image-generation prompts.

The stack is:

- Frontend: Angular 21 standalone app
- Backend: Django 5.2
- Database: PostgreSQL 15
- Cache / lightweight counters: Redis 7
- Container orchestration: Docker Compose
- Reverse/static serving for frontend container: NGINX

At a high level:

1. Angular renders the UI in the browser.
2. Angular calls the Django backend over HTTP.
3. Django stores prompt data in PostgreSQL.
4. Django stores prompt view counters in Redis.
5. Docker Compose runs all services together.

---

# 2. Final Project Structure

At the root:

```text
PromptVault/
├── backend/
├── frontend/
├── venv/
├── doc/
├── docker-compose.yml
├── .gitignore
└── README.md
```

Meaning:

- `backend/` contains the Django app and backend Docker assets.
- `frontend/` contains the Angular app and frontend Docker assets.
- `venv/` is the local Python virtual environment for non-Docker development on Windows.
- `doc/` contains this documentation.
- `docker-compose.yml` describes how all containers run together.

---

# 3. Phase 1: Project Scaffolding

## 3.1 Why Phase 1 existed

Before writing app logic, we needed a base project skeleton:

- Python virtual environment
- Django project
- Django app
- Angular app
- root config placeholders

This is the equivalent of creating the repo “bones”.

## 3.2 Commands used

These were the important commands run conceptually from the root `PromptVault/` folder:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install django
django-admin startproject backend
cd backend
python manage.py startapp prompts
cd ..
ng new frontend --routing=true --style=scss --skip-git=true --ssr=false
```

Additional root files were created:

```text
docker-compose.yml
.gitignore
README.md
```

## 3.3 What each command did

### `python -m venv venv`

Creates a Python virtual environment in a folder named `venv/`.

Why this matters:

- Python packages otherwise install globally on your machine.
- A virtual environment isolates project dependencies.
- Different projects can use different package versions safely.

### `.\venv\Scripts\Activate.ps1`

Activates the virtual environment in PowerShell.

Why this matters:

- After activation, `python` and `pip` point to the project-local Python inside `venv/`.
- Anything installed with `pip` goes into this project’s environment, not your whole OS.

### `python -m pip install django`

Installed Django so `django-admin` and Django project tooling would be available.

### `django-admin startproject backend`

Created the Django project named `backend`.

That generated:

- `backend/manage.py`
- `backend/backend/settings.py`
- `backend/backend/urls.py`
- `backend/backend/wsgi.py`
- `backend/backend/asgi.py`

Important conceptual distinction:

- outer `backend/` = project root folder
- inner `backend/` = Django configuration package

### `python manage.py startapp prompts`

Created the Django application named `prompts`.

In Django, a “project” contains settings and global wiring.
A Django “app” contains one chunk of business logic.

In this case:

- project = full backend site
- app = prompt-management domain

### `ng new frontend --routing=true --style=scss --skip-git=true --ssr=false`

Created the Angular application.

Important flags:

- `--routing=true`: Angular router enabled
- `--style=scss`: use SCSS instead of CSS
- `--skip-git=true`: do not auto-init a Git repo
- `--ssr=false`: no server-side rendering

## 3.4 Important note about Angular version

You asked for Angular `v14+ only`.

The machine already had Angular CLI `21.2.7`.

That is valid because:

- 21 is greater than 14
- your requirement was “v14+”, not “exactly 14”

This matters because Angular 21 generates a slightly newer app structure than older Angular versions.

For example:

- it originally generated `app.ts` instead of `app.component.ts`
- later we introduced `app.component.ts` manually for a cleaner shell structure

---

# 4. Phase 2: Dependencies and Initial Docker Files

## 4.1 Goal of Phase 2

After scaffolding, the next step was:

- install required Python packages
- install Angular Material and Angular packages
- create Dockerfiles
- create `.env`
- fill `.gitignore`
- create initial `docker-compose.yml`

## 4.2 Python packages installed

These packages were installed in the activated virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
pip install django==5.2
pip install psycopg2-binary
pip install redis
pip install django-redis
pip install djangorestframework
pip install django-cors-headers
pip install python-decouple
pip install Pillow
pip freeze > backend\requirements.txt
```

## 4.3 Why each Python package exists

### `django==5.2`

The main backend framework.

It provides:

- routing
- ORM
- admin panel
- migrations
- settings system
- request/response handling

### `psycopg2-binary`

PostgreSQL driver for Python.

Without this, Django cannot talk to PostgreSQL.

### `redis`

Python Redis client.

Used directly in `prompts/views.py` to increment and fetch prompt view counters.

### `django-redis`

Lets Django use Redis as a cache backend through `CACHES`.

Even though the code uses the raw Redis client directly too, this package makes Redis officially part of Django’s cache system.

### `djangorestframework`

Installed for API-related capabilities.

Important note:

- the project does **not** use DRF viewsets or serializers
- the backend returns `JsonResponse` manually
- DRF is currently used only lightly through settings and future-readiness

### `django-cors-headers`

Allows the Angular frontend on port `4200` to call Django on port `8000`.

Without CORS configuration, the browser would block cross-origin API requests.

### `python-decouple`

Reads environment variables from `.env`.

This is why Django settings can do:

```python
config('SECRET_KEY')
```

instead of hardcoding everything.

### `Pillow`

Python imaging library.

It is not heavily used yet, but it is commonly needed when projects later add image uploads or admin image fields.

## 4.4 Angular-side installs

These were the key frontend installs:

```powershell
cd frontend
ng add @angular/material
npm install @angular/forms
npm install @angular/router
cd ..
```

### Important issue encountered

The Angular Material schematic partially failed with an internal error:

```text
Cannot read properties of undefined (reading 'primary')
```

What happened:

- package installation succeeded
- some automatic theme setup did not finish

How it was fixed:

- `@angular/material` and `@angular/cdk` remained installed
- theme import was added manually in `src/styles.scss`
- animations wiring was completed in Angular config

Later, another build issue showed that `@angular/animations` was also required, so it was installed separately.

---

# 5. Phase 3: Django Backend Development

## 5.1 Goal of Phase 3

The objective here was to turn the empty Django app into a working API.

That included:

- settings
- PostgreSQL config
- Redis config
- models
- views
- URLs
- admin registration
- migrations
- seed script

## 5.2 Django settings explained

File:

`backend/backend/settings.py`

Important parts:

### `BASE_DIR`

```python
BASE_DIR = Path(__file__).resolve().parent.parent
```

This points to the Django project root, which helps Django locate files relative to the project.

### `SECRET_KEY`

Used for cryptographic signing in Django.

Examples:

- session signing
- CSRF tokens
- password reset tokens

Current dev value:

```text
super-secret-key-change-in-production
```

This is okay for local/dev only.

### `DEBUG`

Current value:

```text
True
```

Meaning:

- errors show detailed debug pages
- useful in development
- unsafe in production

### `ALLOWED_HOSTS`

Controls which host headers Django accepts.

Current dev values include:

- `localhost`
- `127.0.0.1`
- `0.0.0.0`
- `backend`

Why `backend` matters:

- inside Docker, containers refer to each other by service name
- nginx or other services may talk to the backend using hostname `backend`

### `INSTALLED_APPS`

Includes:

- Django built-ins
- `corsheaders`
- `rest_framework`
- `prompts`

This tells Django which modules are active.

### `MIDDLEWARE`

Middleware are request/response processing layers.

Of special importance:

- `corsheaders.middleware.CorsMiddleware`
- `django.middleware.security.SecurityMiddleware`
- session, auth, csrf, common middleware

### `DATABASES`

Configured for PostgreSQL:

```python
'ENGINE': 'django.db.backends.postgresql'
```

Environment-driven values:

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`

### `CACHES`

Configured so Django points at Redis:

```python
'BACKEND': 'django_redis.cache.RedisCache'
```

Current Redis URL:

```text
redis://localhost:6379/0
```

outside Docker, and:

```text
redis://redis:6379/0
```

inside Docker Compose.

### `CORS_ALLOWED_ORIGINS`

Allows the Angular frontend to call the backend:

- `http://localhost:4200`
- `http://127.0.0.1:4200`

### `REST_FRAMEWORK`

Configured to return JSON-only rendering by default.

This keeps API responses clean and avoids DRF’s browsable API renderer.

## 5.3 Models

File:

`backend/prompts/models.py`

There are two models.

### `Tag`

Fields:

- `name`

Why:

- tags let prompts be categorized
- examples: `cyberpunk`, `anime`, `fantasy`

### `Prompt`

Fields:

- `title`
- `content`
- `complexity`
- `tags` (many-to-many)
- `created_at`

Important detail:

```python
tags = models.ManyToManyField(Tag, blank=True, related_name='prompts')
```

This means:

- one prompt can have many tags
- one tag can belong to many prompts

That is a classic many-to-many relationship.

## 5.4 Views

File:

`backend/prompts/views.py`

The backend uses class-based Django `View` classes and `JsonResponse`.

### `PromptListView.get`

Responsibilities:

- fetch all prompts
- optionally filter by tag name
- fetch each prompt’s Redis view count
- return a JSON array

### `PromptListView.post`

Responsibilities:

- parse request JSON
- validate title/content/complexity
- create prompt
- create or reuse tags
- attach tags to prompt
- return created prompt JSON

### `PromptDetailView.get`

Responsibilities:

- load one prompt by primary key
- increment Redis counter for that prompt
- return the prompt JSON including `view_count`

### `TagListView.get`

Returns all tags as a simple JSON array.

## 5.5 Why Redis is used here

Redis is used as a fast counter store for prompt views.

The database stores durable prompt records.
Redis stores transient, fast-changing counter data.

That separation is common because:

- Redis is very fast for increment operations
- you do not need to write every page view to PostgreSQL

## 5.6 URLs

### Root backend urls

File:

`backend/backend/urls.py`

Routes:

- `/admin/`
- `/api/`

### Prompt app urls

File:

`backend/prompts/urls.py`

Routes:

- `/api/prompts/`
- `/api/prompts/<id>/`
- `/api/tags/`

## 5.7 Admin

File:

`backend/prompts/admin.py`

This registers both models with Django admin.

Why it matters:

- you can inspect and edit prompts/tags in Django admin
- useful for debugging and content management

## 5.8 Migrations

Command used:

```powershell
.\venv\Scripts\Activate.ps1
cd backend
python manage.py makemigrations prompts
cd ..
```

What this did:

- compared `models.py` to existing migration history
- generated `backend/prompts/migrations/0001_initial.py`

Why this is important:

- Django models are Python code
- PostgreSQL tables need SQL schema
- migrations are the bridge between the two

`makemigrations` creates migration files.
`migrate` actually applies them to the database.

## 5.9 Seed script

File:

`backend/seed.py`

Purpose:

- create sample tags
- create 5 sample prompts

Why this matters:

- the UI has real data to show immediately
- useful for testing without manually entering content

---

# 6. Phase 4: Angular Frontend Development

## 6.1 Goal of Phase 4

Turn the empty Angular shell into a working frontend that can:

- list prompts
- filter by tags
- show prompt details
- create new prompts

## 6.2 Angular mental model for a React developer

If you know React, here is the closest mapping:

- Angular component ~= React component
- Angular service ~= shared API/helper module with dependency injection
- Angular router ~= React Router
- Angular template syntax ~= JSX alternative
- Angular reactive forms ~= controlled-form abstraction
- Angular dependency injection ~= framework-managed imports/instances

Main difference:

- Angular is more structured and framework-driven
- React is more library-oriented and compositional

## 6.3 Environment config

File:

`frontend/src/environments/environment.ts`

Contains:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

Purpose:

- central place for the API base URL
- avoids hardcoding URLs throughout the app

## 6.4 TypeScript models

File:

`frontend/src/app/models/prompt.model.ts`

Interfaces:

- `Tag`
- `Prompt`
- `CreatePromptDto`

Why:

- gives strong typing to backend responses
- improves editor support and compile-time safety

For example:

- `Prompt.tags` is known to be `Tag[]`
- `createPrompt()` expects exactly the DTO shape the backend wants

## 6.5 API service

File:

`frontend/src/app/services/prompt.service.ts`

Methods:

- `getPrompts(tag?: string)`
- `getPrompt(id: number)`
- `createPrompt(data: CreatePromptDto)`
- `getTags()`

This is Angular’s equivalent of centralizing all fetch/axios calls in one module.

Why this matters:

- UI components stay focused on presentation/state
- API logic stays in one place
- if endpoint URLs change, you fix one file

## 6.6 Routing

File:

`frontend/src/app/app.routes.ts`

Routes:

- `/` redirects to `/prompts`
- `/prompts` loads list component
- `/prompts/new` loads create form
- `/prompts/:id` loads detail component

Important detail:

`/prompts/new` must come before `/prompts/:id`

Why:

- otherwise Angular would treat `"new"` as the `:id` parameter

## 6.7 Standalone components

Instead of Angular modules, this app uses standalone components.

That means each component declares its own imports directly:

```ts
imports: [MatButtonModule, MatCardModule]
```

Why this matters:

- simpler than old `AppModule`/feature-module patterns
- more local and explicit
- easier to lazy-load by component

## 6.8 Prompt list component

Files:

- `frontend/src/app/components/prompt-list/prompt-list.component.ts`
- `.html`
- `.scss`

Responsibilities:

- fetch prompts on init
- fetch tags on init
- filter prompts by tag
- render cards
- navigate to details
- navigate to create form

UI details:

- complexity badge colors:
  - 1–3: green
  - 4–7: orange
  - 8–10: red

This is a clean example of a “container-style” component:

- it loads data
- stores state
- renders UI from that state

## 6.9 Prompt detail component

Files:

- `frontend/src/app/components/prompt-detail/prompt-detail.component.ts`
- `.html`
- `.scss`

Responsibilities:

- read route param `id`
- fetch one prompt
- display title, content, tags, complexity, created date, and `view_count`
- show spinner while loading
- navigate back to list

Important backend interaction:

- every GET to `/api/prompts/:id/` increments Redis view count

So opening a detail page is not just read-only; it changes view count.

## 6.10 Prompt form component

Files:

- `frontend/src/app/components/prompt-form/prompt-form.component.ts`
- `.html`
- `.scss`

Uses Angular Reactive Forms.

Fields:

- `title`
- `content`
- `complexity`
- `tags`

Validators:

- title: required, min 3 chars
- content: required, min 20 chars
- complexity: required, min 1, max 10

Why reactive forms matter:

- explicit validation model
- easy access to form state
- easier to show inline errors

## 6.11 Root shell

Files:

- `frontend/src/app/app.component.ts`
- `frontend/src/app/app.component.html`
- `frontend/src/app/app.component.scss`

Purpose:

- render top Material toolbar
- render app brand: `PromptVault`
- place `<router-outlet />` below it

This is the Angular shell around all routed pages.

## 6.12 App config

File:

`frontend/src/app/app.config.ts`

Important providers:

- `provideHttpClient()`
- `provideAnimationsAsync()`
- `provideRouter(routes)`

Why they matter:

### `provideHttpClient()`

Enables Angular `HttpClient`.

Without it, the service cannot make HTTP requests.

### `provideAnimationsAsync()`

Enables Angular animations support, needed by Angular Material.

### `provideRouter(routes)`

Registers Angular routing.

## 6.13 Global styles

File:

`frontend/src/styles.scss`

Contains:

- Indigo/Pink Material theme import
- body background
- global card hover class
- complexity badge base classes

Why central styles matter:

- avoids duplicating shared visual tokens in every component
- acts like a small design system layer

## 6.14 Important Angular issue encountered

When building:

```text
Could not resolve "@angular/animations/browser"
```

Meaning:

- Material/animations support was wired in config
- but `@angular/animations` package had not actually been installed

Fix:

```powershell
npm install @angular/animations
```

After that:

```powershell
ng build --configuration development
```

worked successfully.

---

# 7. Phase 5: Docker, Full Stack Wiring, and Runtime Verification

This phase is the most important for DevOps understanding.

---

# 8. Docker Basics First

If Docker is new, understand these terms clearly.

## 8.1 Image

A Docker image is a packaged blueprint.

Think:

- like a production snapshot
- includes OS layer + runtime + app files + commands

Examples in this project:

- `postgres:15`
- `redis:7`
- custom backend image built from `backend/Dockerfile`
- custom frontend image built from `frontend/Dockerfile`

## 8.2 Container

A container is a running instance of an image.

Think:

- image = class
- container = object instance

Examples:

- `promptvault_db`
- `promptvault_redis`
- `promptvault_backend`
- `promptvault_frontend`

## 8.3 Dockerfile

A Dockerfile explains how to build one image.

This project has:

- `backend/Dockerfile`
- `frontend/Dockerfile`

## 8.4 Docker Compose

Compose is a multi-container orchestration file.

It defines:

- what services exist
- which ports they expose
- what environment variables they get
- what volumes they use
- what networks they share

In this project, `docker-compose.yml` ties together:

- PostgreSQL
- Redis
- Django backend
- Angular frontend via NGINX

---

# 9. `docker-compose.yml` Explained in Detail

File:

`docker-compose.yml`

## 9.1 `db` service

```yaml
db:
  image: postgres:15
```

This pulls the official PostgreSQL image version 15.

Environment variables:

- `POSTGRES_DB=promptvault`
- `POSTGRES_USER=promptvault_user`
- `POSTGRES_PASSWORD=promptvault_pass`

These control initial database bootstrapping.

Port mapping:

```yaml
ports:
  - "5432:5432"
```

Meaning:

- left side = host port
- right side = container port

So:

- your Windows machine can reach Postgres on `localhost:5432`
- the Postgres process inside the container also listens on `5432`

Volume:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

Why this matters:

- Postgres stores actual database files there
- if the container is removed, the data survives because it is in a named Docker volume

Without the volume, every container recreation would wipe the database.

## 9.2 `redis` service

```yaml
redis:
  image: redis:7
```

Runs Redis version 7.

Port mapping:

```yaml
6379:6379
```

This is the default Redis port.

Redis is used here for prompt view counters.

## 9.3 `backend` service

This is the custom Django container.

Build section:

```yaml
build:
  context: ./backend
  dockerfile: Dockerfile
```

Meaning:

- use `backend/` as build context
- use `backend/Dockerfile`

Environment variables passed into the container:

- `DB_NAME=promptvault`
- `DB_USER=promptvault_user`
- `DB_PASSWORD=promptvault_pass`
- `DB_HOST=db`
- `DB_PORT=5432`
- `REDIS_URL=redis://redis:6379/0`
- `DEBUG=True`
- `SECRET_KEY=super-secret-key-change-in-production`
- `ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,backend`

Important Docker networking concept:

- `DB_HOST=db` means “talk to the container named by the compose service `db`”
- `redis://redis:6379/0` means “talk to the compose service `redis`”

Inside Docker, service names act like hostnames on the shared Compose network.

Port mapping:

```yaml
8000:8000
```

So Django is available on your host at:

`http://localhost:8000`

Volume:

```yaml
- ./backend:/app
```

Meaning:

- your local `backend/` folder is mounted into the container at `/app`
- changes to local code immediately appear inside the container

This is ideal for development.

## 9.4 `frontend` service

Builds from `frontend/Dockerfile`.

Port mapping:

```yaml
4200:80
```

Meaning:

- on your machine, visit `http://localhost:4200`
- inside the container, NGINX serves on port `80`

This is different from Angular CLI dev-server.

Here:

- Angular is built statically
- NGINX serves the build output

## 9.5 Named volume

```yaml
volumes:
  postgres_data:
```

This defines the named persistent volume used by PostgreSQL.

---

# 10. Backend Dockerfile Explained

File:

`backend/Dockerfile`

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN chmod +x entrypoint.sh
EXPOSE 8000
CMD ["sh", "entrypoint.sh"]
```

## 10.1 `FROM python:3.11-slim`

Base image.

Why `slim`:

- smaller than full Python image
- still suitable for app runtime

## 10.2 `WORKDIR /app`

Sets the current working directory inside the image.

All following commands run relative to `/app`.

## 10.3 `COPY requirements.txt .`

Copies only `requirements.txt` first.

Why this is smart:

- Docker layer caching
- if your Python requirements do not change, Docker can reuse the installed dependencies layer

## 10.4 `RUN pip install ...`

Installs backend dependencies into the image.

## 10.5 `COPY . .`

Copies the actual backend source code.

This comes **after** dependency install for better cache efficiency.

## 10.6 `RUN chmod +x entrypoint.sh`

Makes the shell entrypoint executable.

## 10.7 `EXPOSE 8000`

Documents that the container serves on port `8000`.

## 10.8 `CMD ["sh", "entrypoint.sh"]`

Instead of launching Django directly, the container runs the entrypoint script.

That is important because startup now needs:

1. wait for PostgreSQL
2. run migrations
3. start Django server

---

# 11. Backend Entrypoint Explained

File:

`backend/entrypoint.sh`

Purpose:

- prevent Django from crashing if Postgres is not ready yet

This solves a classic container race condition.

Problem:

- Compose may start both containers quickly
- PostgreSQL process may still be booting
- Django tries to connect immediately and fails

Solution:

- loop until `DB_HOST:DB_PORT` is reachable
- then run migrations
- then run the Django dev server

Command flow in the script:

1. print waiting message
2. use Python socket connect attempts in a loop
3. sleep and retry if PostgreSQL is not reachable
4. run `python manage.py migrate --noinput`
5. run `python manage.py runserver 0.0.0.0:8000`

This is one of the most important Docker reliability improvements in the project.

---

# 12. Frontend Dockerfile Explained

File:

`frontend/Dockerfile`

This is a multi-stage build.

## 12.1 Why multi-stage builds matter

You do not want:

- `node_modules`
- Angular build tooling
- TypeScript compiler

inside your final runtime image if all you need is static files served by NGINX.

So the Dockerfile does:

1. build with Node
2. serve with NGINX

## 12.2 Build stage

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production
```

This produces the Angular production build.

Important output:

```text
/app/dist/frontend/browser
```

The `/browser` part matters for newer Angular build output.

## 12.3 Runtime stage

```dockerfile
FROM nginx:alpine
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

This stage:

- copies built static files into NGINX web root
- replaces default NGINX config with your custom one
- serves the app on port `80`

---

# 13. Frontend NGINX Config Explained

File:

`frontend/nginx.conf`

This file does two critical jobs.

## 13.1 Serve Angular static files

```nginx
root /usr/share/nginx/html;
index index.html;
```

This is where the built Angular files are copied.

## 13.2 Angular client-side routing fallback

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Why this matters:

Suppose you visit:

`http://localhost:4200/prompts/1`

Without this fallback:

- NGINX looks for a real file `/prompts/1`
- it does not exist
- you get 404

With this fallback:

- NGINX serves `index.html`
- Angular router takes over in the browser

This is essential for SPAs.

## 13.3 Proxy `/api/` to Django

```nginx
location /api/ {
    proxy_pass http://backend:8000/api/;
}
```

Why this is useful:

- frontend container can proxy API calls internally to Django
- avoids a separate public domain in local dev
- mirrors how reverse proxies often behave in production

Even though the Angular environment currently calls `http://localhost:8000/api` directly, this proxy is now available and useful.

---

# 14. `.dockerignore` Files Explained

## 14.1 Backend `.dockerignore`

File:

`backend/.dockerignore`

Contents:

- `venv/`
- `__pycache__/`
- `*.pyc`
- `.env`
- `db.sqlite3`

Purpose:

- do not send unnecessary files to Docker build context
- keep secrets like `.env` out of image context
- reduce build size and speed up builds

## 14.2 Frontend `.dockerignore`

File:

`frontend/.dockerignore`

Contents:

- `node_modules/`
- `dist/`
- `.angular/`

Purpose:

- let Docker build install clean dependencies inside the image
- do not copy local build caches into the container context

---

# 15. PostgreSQL in This Project

## 15.1 What PostgreSQL is doing here

PostgreSQL is the relational database storing durable application data.

Specifically, it stores:

- prompts
- tags
- many-to-many relationships between prompts and tags
- Django built-in tables:
  - auth
  - admin
  - sessions
  - contenttypes

## 15.2 Development DB credentials

Current dev credentials:

- DB name: `promptvault`
- DB user: `promptvault_user`
- DB password: `promptvault_pass`
- Host outside Docker: `localhost`
- Host inside Docker: `db`
- Port: `5432`

These are development credentials only.

## 15.3 Why two different hosts exist

Outside Docker:

- your machine reaches Postgres at `localhost:5432`

Inside Docker:

- the backend container must use `db:5432`

This difference is one of the most common beginner confusion points.

Rule:

- host machine talking to container: use mapped host port
- one container talking to another: use compose service name

---

# 16. Redis in This Project

## 16.1 What Redis is doing here

Redis stores prompt view counters.

Examples:

- key: `prompt:views:1`
- value: number of detail-page views for prompt 1

## 16.2 Why not store that in PostgreSQL?

You could.

But Redis is ideal for:

- fast increments
- ephemeral counters
- low-latency reads/writes

In larger systems, this keeps hot counters out of your primary relational tables.

## 16.3 Development Redis details

- Host outside Docker: `localhost`
- Host inside Docker: `redis`
- Port: `6379`
- URL inside Docker: `redis://redis:6379/0`

Database `0` in Redis just means logical DB index 0.

---

# 17. Environment Variables and Secrets

There are two main places env-like config exists:

## 17.1 `backend/.env`

Used for local, non-Docker backend development.

Contains:

- `SECRET_KEY`
- `DEBUG`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `REDIS_URL`
- `ALLOWED_HOSTS`

## 17.2 `docker-compose.yml`

Used for container runtime env injection.

These override local assumptions for Docker networking, especially:

- `DB_HOST=db`
- `REDIS_URL=redis://redis:6379/0`

## 17.3 Important passwords and credentials currently in this project

These are dev-only values currently in use:

### PostgreSQL

- User: `promptvault_user`
- Password: `promptvault_pass`
- Database: `promptvault`

### Django superuser

- Username: `admin`
- Email: `admin@promptvault.com`
- Password: `admin123`

### Django secret key

- `super-secret-key-change-in-production`

These are acceptable for local learning/dev.
They are not acceptable for production.

---

# 18. Every Important Command We Ran, Explained

This section is the explicit command log in human terms.

## 18.1 Python and Django setup

```powershell
python -m venv venv
```

Create isolated Python env.

```powershell
.\venv\Scripts\Activate.ps1
```

Activate env in PowerShell.

```powershell
python -m pip install django
```

Install Django.

```powershell
django-admin startproject backend
```

Generate Django project.

```powershell
cd backend
python manage.py startapp prompts
cd ..
```

Create app where prompt logic lives.

## 18.2 Backend dependency installs

```powershell
pip install django==5.2
pip install psycopg2-binary
pip install redis
pip install django-redis
pip install djangorestframework
pip install django-cors-headers
pip install python-decouple
pip install Pillow
pip freeze > backend\requirements.txt
```

Purpose:

- lock backend dependencies
- enable PostgreSQL, Redis, API/CORS support, image support, env parsing

## 18.3 Angular scaffold

```powershell
ng new frontend --routing=true --style=scss --skip-git=true --ssr=false
```

Create Angular app.

## 18.4 Angular package commands

```powershell
ng add @angular/material
npm install @angular/forms
npm install @angular/router
npm install @angular/animations
```

Purpose:

- Angular Material UI components
- form support
- routing package
- animations support required by Material

## 18.5 Django migrations

```powershell
cd backend
python manage.py makemigrations prompts
```

Create migration file for models.

Later:

```powershell
docker compose exec backend python manage.py migrate
```

Apply migrations to PostgreSQL inside container.

## 18.6 Angular build

```powershell
cd frontend
ng build --configuration development
```

Development build verification.

Later inside Docker frontend build stage:

```powershell
npm run build -- --configuration production
```

Production static build for NGINX.

## 18.7 Docker Compose commands

```powershell
docker compose up --build -d
```

Meaning:

- `up`: create/start services
- `--build`: rebuild images first
- `-d`: detached mode

```powershell
docker compose ps
```

Show running service/container status.

```powershell
docker compose logs --tail=120
```

Inspect recent logs.

```powershell
docker compose down
```

Stop and remove containers/network for this compose project.

## 18.8 Superuser creation

To avoid interactive prompts in automation, the superuser was created with env vars:

```powershell
docker compose exec -e DJANGO_SUPERUSER_USERNAME=admin `
  -e DJANGO_SUPERUSER_EMAIL=admin@promptvault.com `
  -e DJANGO_SUPERUSER_PASSWORD=admin123 `
  backend python manage.py createsuperuser --noinput
```

## 18.9 Seed command

```powershell
docker compose exec backend python seed.py
```

Loads 5 example prompts and tag data.

---

# 19. Important Runtime Issues We Hit and What They Mean

These are excellent learning moments.

## 19.1 PATH visibility issue in the sandbox

Early on, `python`, `pip`, and `ng` were not visible in the default shell context used by the tooling.

What that means:

- the programs existed on your machine
- but the restricted shell environment did not inherit the full PATH correctly

Workaround:

- commands were rerun in unrestricted shell mode

This was a tooling-context issue, not a project bug.

## 19.2 Angular Material schematic failure

Error:

```text
Cannot read properties of undefined (reading 'primary')
```

Meaning:

- package install succeeded
- the generator’s automatic config patching did not fully complete

Fix:

- manually wired theme and animations

## 19.3 Missing `@angular/animations`

Error:

```text
Could not resolve "@angular/animations/browser"
```

Meaning:

- Angular Material expected the animations package
- it was not yet installed

Fix:

```powershell
npm install @angular/animations
```

## 19.4 Redis port conflict on host

During Docker startup:

```text
Bind for 0.0.0.0:6379 failed: port is already allocated
```

Meaning:

- some other container was already using host port `6379`
- Compose could not bind PromptVault Redis to that port

Actual conflicting container:

- `iambilly-redis`

Fix:

```powershell
docker stop iambilly-redis
```

This freed port 6379.

## 19.5 Redis container network attachment issue

After one startup attempt, the backend failed with:

```text
Error -5 connecting to redis:6379. No address associated with hostname.
```

Meaning:

- backend expected hostname `redis` to resolve on compose network
- Redis container happened to be running but was not attached correctly to the compose network during that intermediate state

Fix:

```powershell
docker compose down
docker compose up --build -d
```

That recreated the network cleanly and resolved DNS between services.

This is a very real Docker lesson:

- container “running” does not always mean networking is healthy
- checking `docker inspect` and service DNS matters

---

# 20. How Requests Flow Through the Full Stack

Let’s trace real app behavior.

## 20.1 Visiting `http://localhost:4200/`

Flow:

1. Browser requests port `4200` on your machine.
2. Docker maps host `4200` to frontend container port `80`.
3. NGINX serves Angular static files.
4. Angular router loads `/prompts`.
5. Prompt list component calls backend API.

## 20.2 Fetching prompts

Angular service requests:

`http://localhost:8000/api/prompts/`

Flow:

1. Request hits Django container on port `8000`.
2. Django route `/api/prompts/` maps to `PromptListView`.
3. Django queries PostgreSQL for prompt rows.
4. Django queries Redis for each prompt’s view count.
5. Django returns JSON array.
6. Angular renders prompt cards.

## 20.3 Opening a prompt detail

Request:

`GET /api/prompts/1/`

Flow:

1. Django loads prompt 1 from PostgreSQL.
2. Django increments Redis key `prompt:views:1`.
3. Response includes `view_count`.
4. Angular displays detail page.

## 20.4 Creating a prompt

Form submit flow:

1. Angular reactive form validates input first.
2. Angular POSTs JSON to `/api/prompts/`.
3. Django validates again server-side.
4. Django creates `Prompt`.
5. Django creates or fetches `Tag` objects.
6. Django links tags to prompt.
7. Angular navigates back to list.

This is important:

- frontend validation improves UX
- backend validation enforces truth/security

Never trust only frontend validation.

---

# 21. Backend File-by-File Learning Guide

## `backend/manage.py`

Django command entrypoint.

You use it for:

- `runserver`
- `makemigrations`
- `migrate`
- `createsuperuser`

## `backend/backend/settings.py`

Main backend configuration.

Learn this file first if you are new to Django.

## `backend/backend/urls.py`

Global URL table.

## `backend/prompts/models.py`

Defines database schema in Python.

## `backend/prompts/views.py`

Contains request handlers for your API.

## `backend/prompts/urls.py`

Maps app-specific endpoints to views.

## `backend/prompts/admin.py`

Controls Django admin exposure for models.

## `backend/prompts/migrations/0001_initial.py`

Auto-generated schema migration.

## `backend/seed.py`

Convenience script for sample data.

## `backend/.env`

Local, non-container config.

## `backend/Dockerfile`

Explains how backend image is built.

## `backend/entrypoint.sh`

Startup orchestration for DB wait + migrate + server.

---

# 22. Frontend File-by-File Learning Guide

## `frontend/package.json`

Project metadata, scripts, and dependencies.

Important scripts:

- `npm start`
- `npm run build`
- `npm run watch`

## `frontend/angular.json`

Angular workspace configuration.

Controls build behavior, assets, and target settings.

## `frontend/src/main.ts`

Bootstraps the Angular app.

Equivalent to the “entry file”.

## `frontend/src/environments/environment.ts`

Stores API base URL.

## `frontend/src/app/app.config.ts`

App-level providers.

## `frontend/src/app/app.routes.ts`

Client-side routing.

## `frontend/src/app/app.component.*`

Root shell UI.

## `frontend/src/app/models/prompt.model.ts`

Type definitions for backend data.

## `frontend/src/app/services/prompt.service.ts`

Central API layer.

## `frontend/src/app/components/prompt-list/*`

List page.

## `frontend/src/app/components/prompt-detail/*`

Detail page.

## `frontend/src/app/components/prompt-form/*`

Create form page.

## `frontend/src/styles.scss`

Global theme and reusable visual classes.

## `frontend/nginx.conf`

Frontend web server config inside Docker runtime.

## `frontend/Dockerfile`

Frontend build and runtime image definition.

---

# 23. Local Development vs Docker Development

You now have two ways to think about this project.

## 23.1 Local native development

Backend:

```powershell
.\venv\Scripts\Activate.ps1
cd backend
python manage.py runserver
```

Frontend:

```powershell
cd frontend
npm install
ng serve
```

In this mode:

- Django runs directly on Windows
- Angular dev server runs directly on Windows
- Postgres/Redis may still come from Docker or local installs

## 23.2 Full Docker development

```powershell
docker compose up --build -d
```

In this mode:

- PostgreSQL runs in container
- Redis runs in container
- Django runs in container
- frontend runs via NGINX in container

This is closer to deployable infrastructure behavior.

---

# 24. How to Think About Angular Here If You Come From React

If you are used to React, the main Angular ideas to internalize are:

## 24.1 Templates instead of JSX

Angular HTML templates use directives like:

- `@if`
- `@for`
- `[value]`
- `(click)`
- `{{ expression }}`

Examples:

- `(click)="submit()"` ~= `onClick={submit}`
- `{{ prompt.title }}` ~= `{prompt.title}`
- `[disabled]="isSubmitting"` ~= `disabled={isSubmitting}`

## 24.2 DI instead of importing singleton helpers everywhere

Angular commonly uses:

```ts
private readonly promptService = inject(PromptService);
```

instead of manually constructing service objects.

## 24.3 Forms are more framework-managed

Reactive forms are structured, explicit, and class-driven.

That is more opinionated than many React form setups.

## 24.4 Router is configuration-first

Angular route definitions are centralized and lazy loading is standard.

---

# 25. How to Think About Django Here If You Are New

The most important Django ideas:

## 25.1 Models are schema

In Django, model classes define DB structure.

## 25.2 Migrations are schema history

You do not manually write SQL first.

Usually:

1. edit model
2. run `makemigrations`
3. run `migrate`

## 25.3 Views handle requests

Here, views are plain class-based request handlers.

## 25.4 URLs map routes to views

Django is very explicit about route wiring.

## 25.5 Settings are central

Much of Django behavior is configured in `settings.py`.

## 25.6 Admin is built in

This is one of Django’s best features.

You got a full admin panel almost “for free”.

---

# 26. Recommended Learning Order for You

Since you already know frontend and JS well, learn this project in this order:

1. Read `frontend/src/app/services/prompt.service.ts`
2. Read `frontend/src/app/components/prompt-list/*`
3. Read `frontend/src/app/components/prompt-detail/*`
4. Read `frontend/src/app/components/prompt-form/*`
5. Read `backend/prompts/urls.py`
6. Read `backend/prompts/views.py`
7. Read `backend/prompts/models.py`
8. Read `backend/backend/settings.py`
9. Read `docker-compose.yml`
10. Read `backend/Dockerfile`, `frontend/Dockerfile`, and `frontend/nginx.conf`
11. Read `backend/entrypoint.sh`

That order lets you move from familiar frontend ideas to less familiar backend/infrastructure ideas.

---

# 27. Quick Operational Cheat Sheet

## Start full stack

```powershell
docker compose up --build -d
```

## See running containers

```powershell
docker compose ps
```

## See logs

```powershell
docker compose logs --tail=100
```

## Stop stack

```powershell
docker compose down
```

## Run migrations inside backend container

```powershell
docker compose exec backend python manage.py migrate
```

## Seed sample data

```powershell
docker compose exec backend python seed.py
```

## Open backend API

- `http://localhost:8000/api/prompts/`
- `http://localhost:8000/api/prompts/1/`
- `http://localhost:8000/api/tags/`

## Open frontend

- `http://localhost:4200/`

## Open Django admin

- `http://localhost:8000/admin/`

## Admin login

- Username: `admin`
- Password: `admin123`

---

# 28. Final Important Warnings

These values are development-only:

- DB password: `promptvault_pass`
- Django secret key: `super-secret-key-change-in-production`
- Admin password: `admin123`
- `DEBUG=True`

If you ever deploy this:

- change all secrets
- set `DEBUG=False`
- restrict `ALLOWED_HOSTS`
- use production-grade static serving and app serving
- do not use Django dev server as production server
- consider Gunicorn/Uvicorn behind reverse proxy
- use secure Postgres and Redis configs

---

# 29. What You Have Actually Built

You now have:

- a Dockerized PostgreSQL database
- a Dockerized Redis cache
- a Django API server with admin
- a seedable data model
- an Angular frontend with routing, forms, and Material UI
- NGINX serving the frontend
- a compose-based local development stack

That is a real full-stack application architecture, even if it started from vibe-coded iteration.

The best next step for you is not to rewrite everything blindly.

The best next step is:

1. run the app
2. read one layer at a time
3. make one small change yourself in each layer
4. observe how data flows from Angular to Django to PostgreSQL/Redis and back

---

# 30. Phase 6: JWT Authentication

## 30.1 Goal of Phase 6

After the public prompt browsing flow was working, the next step was to add authentication so prompt creation would no longer be fully open.

The requirement for this phase was:

- keep `GET` endpoints public
- protect only prompt creation
- add login support in Angular
- persist tokens in the browser
- automatically attach auth headers to API calls

In other words:

- reading prompts should stay frictionless
- creating prompts should require identity

---

## 30.2 Backend package added

The key backend package added in this phase was:

```powershell
pip install djangorestframework-simplejwt
pip freeze > backend\requirements.txt
```

What this package does:

- provides JWT token issue endpoints
- provides JWT authentication classes for DRF
- lets Django validate bearer tokens on protected endpoints

Important resulting additions in `backend/requirements.txt`:

- `djangorestframework_simplejwt`
- `PyJWT`

---

## 30.3 Django settings changes

File:

`backend/backend/settings.py`

Three important things changed.

### `INSTALLED_APPS`

This was added:

```python
'rest_framework_simplejwt'
```

Why:

- it makes SimpleJWT available to Django

### `REST_FRAMEWORK`

The API was switched to JWT-aware defaults:

```python
'DEFAULT_AUTHENTICATION_CLASSES': [
    'rest_framework_simplejwt.authentication.JWTAuthentication',
],
'DEFAULT_PERMISSION_CLASSES': [
    'rest_framework.permissions.IsAuthenticatedOrReadOnly',
],
```

Why this matters:

- authenticated users can do write actions
- unauthenticated users can still read safely

### `SIMPLE_JWT`

This block was added:

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

Meaning:

- access token lasts 60 minutes
- refresh token lasts 1 day
- frontend must send:

```text
Authorization: Bearer <token>
```

---

## 30.4 JWT auth URLs

File:

`backend/backend/urls.py`

Two new endpoints were added:

- `/api/auth/token/`
- `/api/auth/token/refresh/`

These use:

- `TokenObtainPairView`
- `TokenRefreshView`

Behavior:

### `POST /api/auth/token/`

Input:

- username
- password

Output:

- access token
- refresh token

### `POST /api/auth/token/refresh/`

Input:

- refresh token

Output:

- new access token

This is the standard JWT login/refresh flow.

---

## 30.5 Protecting prompt creation

File:

`backend/prompts/views.py`

The `PromptListView` changed from a plain Django `View` to a DRF `APIView`.

That allowed two explicit class settings:

```python
authentication_classes = [JWTAuthentication]
permission_classes = [IsAuthenticatedOrReadOnly]
```

What this means in practice:

- `GET /api/prompts/` remains public
- `POST /api/prompts/` now requires a valid JWT bearer token

This was the exact intended security boundary for the project.

Important conceptual change:

- before this phase, the backend used mostly `JsonResponse`
- during this phase, the protected list/create view moved to DRF `Response`
- prompt detail and tag list remained plain Django views

That is okay.
You do not have to convert every endpoint to DRF at once.

---

## 30.6 Angular authentication layer

Several new frontend files were introduced.

### `frontend/src/app/services/auth.service.ts`

Responsibilities:

- login with username/password
- save access and refresh tokens in `localStorage`
- expose helper methods:
  - `getAccessToken()`
  - `getRefreshToken()`
  - `getUsername()`
  - `isLoggedIn()`
- refresh the access token
- clear auth state on logout

This is the central auth state utility for the Angular app.

### `frontend/src/app/interceptors/auth.interceptor.ts`

Responsibilities:

- inspect every outgoing HTTP request
- attach `Authorization: Bearer <token>` when token exists
- watch for `401`
- try refresh flow once
- retry original request with new access token
- logout if refresh also fails

This is what makes auth feel automatic instead of manual.

### `frontend/src/app/guards/auth.guard.ts`

Responsibilities:

- block navigation to protected routes when not logged in
- redirect to `/login`
- preserve intended destination using `returnUrl`

That last point matters because it improves UX:

- user tries to open `/prompts/new`
- app sends them to login
- after login, app returns them to `/prompts/new`

---

## 30.7 Login screen and route protection

Files:

- `frontend/src/app/components/login/*`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.component.*`

What changed:

### Login route

`/login` was added to routing.

### Prompt create route protection

Only `/prompts/new` was guarded.

This was intentional because:

- browsing should stay public
- creating should require login

### Navbar auth state

The top bar now changes depending on auth state:

- if logged in:
  - show username
  - show logout
- if logged out:
  - show login

### HTTP client registration

The app config now registers the auth interceptor:

```ts
provideHttpClient(withInterceptors([authInterceptor]))
```

Without this, Angular would never attach JWT headers automatically.

---

## 30.8 Validation completed in Phase 6

These checks were performed against the running stack:

- `POST /api/auth/token/` returned access + refresh tokens
- `POST /api/prompts/` returned `401` without token
- `POST /api/prompts/` returned `201` with token
- `POST /api/auth/token/refresh/` returned a new access token
- Angular build succeeded

That proved:

- login worked
- refresh worked
- endpoint protection worked
- frontend and backend were wired correctly

---

## 30.9 Important issue encountered in Phase 6

When the project was moved to a different laptop, the copied `venv/` became invalid.

Why:

- Python virtual environments contain machine-specific interpreter paths
- the moved environment still pointed at the old machineâ€™s Python location

Meaning:

- `venv` existed
- but its executables were no longer trustworthy on the new laptop

Practical outcome:

- Docker remained the safest runtime path
- a temporary fresh local environment was used only to refresh requirements cleanly

This is a real lesson:

- do not rely on a copied Python virtual environment between machines
- recreate the environment locally instead

---

# 31. Phase 7: Tagging Refinement and UI/UX Polish

## 31.1 Goal of Phase 7

Once auth was working, the next phase focused on product quality rather than raw capability.

This phase aimed to improve:

- the tag filtering experience
- prompt discovery UX
- create-form usability
- visual hierarchy
- loading, empty, and error states
- responsive behavior

This was the phase where PromptVault started to feel more like a real product rather than a basic CRUD demo.

---

## 31.2 Tag filter verification

Before changing the UI, the tag filter API itself was checked.

Tested endpoint:

```text
GET /api/prompts/?tag=cyberpunk
```

Relevant backend logic in `backend/prompts/views.py`:

```python
prompts = prompts.filter(tags__name__iexact=tag_filter)
```

Why this matters:

- tag matching remains case-insensitive
- the frontend can safely filter by tag name
- no backend change was needed because the API was already working

This is a good example of verifying behavior before rewriting code.

---

## 31.3 Prompt list UX improvements

Files:

- `frontend/src/app/components/prompt-list/*`

The list view was improved in several ways.

### Better page framing

The list page now presents:

- product title
- descriptive subtitle
- visible prompt count

That gives the page clearer orientation instead of dropping the user straight into a grid.

### Better tag interaction

The filter bar now supports:

- clickable tag pills
- active selected state
- `All` reset action
- consistent highlighted selected tag

This makes filtering feel like part of the UI rather than just a data control.

### Better card information hierarchy

Prompt cards now show:

- title
- complexity badge
- complexity progress meter
- clickable tags
- content preview
- view count summary
- details action

This improves scanability and comparison across prompts.

### Complexity visualization

Complexity appears as:

- a badge like `8/10`
- a horizontal fill indicator

Using the scale:

- `1â€“3` = green
- `4â€“7` = orange
- `8â€“10` = red

This gives both:

- exact numeric value
- fast visual meaning

### Better states

The list page now explicitly handles:

- initial loading
- empty filter result
- API error state

The empty state includes a clear filter action, which is important UX.

---

## 31.4 Prompt detail UX improvements

Files:

- `frontend/src/app/components/prompt-detail/*`

The detail page was enhanced to better surface prompt metadata.

### View count emphasis

Instead of showing views as plain inline text, the UI now presents:

- an eye icon
- a count
- a small stat-card style layout

This makes the view count feel intentional and easier to notice.

### Better date formatting

The prompt creation time is now displayed in a friendlier format using Angular `DatePipe`:

```text
Added on DD MMM YYYY
```

### Complexity panel

Just like the list page, the detail page now shows:

- badge
- progress indicator

So users get consistent interpretation everywhere complexity appears.

### Better not-found state

If a prompt detail fetch fails with `404`, the page now shows:

- `Prompt not found`
- back button

This is much better than a generic failure message.

---

## 31.5 Prompt creation UX improvements

Files:

- `frontend/src/app/components/prompt-form/*`

The create form changed substantially.

### Better tag selection

Instead of a plain select field, tags are now presented more visually.

Behavior:

- fetch all tags on init
- display selectable tag chips/buttons
- allow multiple selection
- keep tags optional
- show selected count

This is better because tags are categorical and visual by nature.

### Character feedback

The form now shows character hints for:

- title
- content

Why that helps:

- users get a sense of input length
- the form feels more responsive and informative

### Live complexity preview

While editing complexity, the form now shows:

- current complexity value
- matching color badge

This gives instant meaning to the number instead of making it feel abstract.

### Success feedback

After a successful prompt create:

- Material snackbar appears
- user is redirected to `/prompts` shortly after

That gives better confirmation than immediate silent navigation.

---

## 31.6 Navbar and navigation improvements

Files:

- `frontend/src/app/app.component.*`

The navbar was improved to support clearer product navigation.

It now includes:

- active-route highlighting
- prompt browse link
- add prompt link
- login/logout area
- current username when logged in

Why active-route highlighting matters:

- users know where they are
- the navigation feels less static

This is a small change with a meaningful UX payoff.

---

## 31.7 Global theme polish

File:

`frontend/src/styles.scss`

This phase also upgraded the overall visual system.

The app now has:

- a dark visual theme
- stronger surface contrast
- global color variables
- refined button styling
- consistent card styling
- smoother transitions

Additional font and icon packages were used to improve feel and hierarchy:

- `Urbanist`
- `Inter`
- `JetBrains Mono`
- `Material Icons Outlined`

This moved the UI away from default Angular Material appearance and toward a more branded interface.

---

## 31.8 Important runtime issue encountered in Phase 7

During UI testing, the frontend appeared stuck on loading spinners even though the backend API was returning real data successfully.

This was a very useful debugging moment.

### What was observed

- browser showed loading state
- backend logs showed successful `200` responses for:
  - `/api/prompts/`
  - `/api/tags/`

Meaning:

- the backend was not the real problem
- the frontend was receiving responses but not updating correctly

### Root cause

The Angular app config needed explicit zone-based change detection support for the current runtime setup.

The fix added:

```ts
provideZoneChangeDetection({ eventCoalescing: true })
```

in:

`frontend/src/app/app.config.ts`

### Secondary issue

Once zone-based change detection was enabled, the app then threw:

```text
Could not resolve "zone.js"
```

Why:

- Angular now expected `zone.js`
- but the package was not yet installed in frontend dependencies

### Final fix

Two things were required:

1. import `zone.js` in `frontend/src/main.ts`
2. install `zone.js` in frontend dependencies

After that:

- Angular rebuilt successfully
- Docker frontend rebuilt successfully
- loading state bug was resolved

This is a strong lesson:

- successful network requests do not guarantee UI updates
- frontend runtime bootstrapping details can break perceived app behavior even when backend logic is correct

---

## 31.9 Validation completed in Phase 7

The following behaviors were verified:

- prompt list API still returned data correctly
- tag filtering worked
- detail view incremented Redis view counts
- unauthorized prompt creation still returned `401`
- authorized prompt creation still returned `201`
- Angular development build succeeded
- Docker frontend production build succeeded

That mattered because Phase 7 was not just a style pass.

It had to preserve:

- auth
- routing
- API integration
- prompt creation
- filtering

while improving the UX layer.

---

# 32. Updated Operational Notes After Phases 6 and 7

These commands became especially important after the auth and UI phases.

## 32.1 Rebuild frontend after UI/runtime changes

```powershell
docker compose up --build -d frontend
```

Why:

- Angular app is served as built static files inside NGINX
- code changes do not appear in Docker frontend until the image is rebuilt

## 32.2 Login endpoint

```text
POST http://localhost:8000/api/auth/token/
```

## 32.3 Refresh endpoint

```text
POST http://localhost:8000/api/auth/token/refresh/
```

## 32.4 App login credentials

Current development credentials remain:

- Username: `admin`
- Password: `admin123`

## 32.5 If the UI appears stale after rebuild

Do a hard browser refresh:

```text
Ctrl + F5
```

Why:

- browser may still hold older frontend bundle files in cache
- this especially mattered during the `zone.js` / loading-state fix

That will convert this from “vibe-coded project” into “project you actually understand”.
