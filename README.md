# PromptVault

PromptVault is my submission for the Emplay Associate Frontend Developer assignment. The application is a full-stack library for discovering, organizing, and managing AI image-generation prompts, built with the required stack of Angular, Django, PostgreSQL, Redis, and Docker.

I treated the assignment as an opportunity to deliver not only a working solution, but also a clean, well-structured system with clear architectural boundaries, production-style setup, and a polished user experience. The final application combines a Dockerized Django API, PostgreSQL persistence, Redis-backed view counters, and an Angular frontend designed as a curated prompt gallery rather than a basic CRUD dashboard.

## Assignment Context

The assignment required:

- an Angular frontend
- a Django backend
- PostgreSQL as the primary database
- Redis for prompt view counting
- Docker Compose setup for the complete stack
- prompt list, prompt detail, and prompt creation flows
- reactive form validation on the frontend

Optional bonus areas included authentication, tagging, and live hosting.

This README explains how I approached the solution, how I organized the project, and why I made the architectural choices reflected in the codebase.

## Requirement Coverage

### Core Requirements Implemented

- Full-stack application with separated frontend and backend
- `Prompt` data model with title, content, complexity, and created timestamp
- Prompt list view
- Prompt detail view
- Prompt creation flow with validation
- PostgreSQL-backed persistence
- Redis-backed live `view_count` on prompt retrieval
- Docker Compose setup for frontend, backend, database, and cache

### Bonus Features Implemented

- JWT-based authentication
- Signup, login, refresh token flow, and signout
- Login using either username or email
- Protected prompt creation
- Tagging system with prompt-tag filtering
- Persistent likes and bookmarks
- Bookmark collection view
- Search with debounced frontend interaction and backend filtering
- Analytics endpoint with tag-aware metrics

### Scope Added Beyond the Assignment Minimum

- Sticky authenticated header
- Curated design system and polished visual hierarchy
- Responsive routed interface with refined loading, empty, and error states
- Seeded prompt library for realistic testing
- NGINX-powered frontend container

## Tech Stack

### Frontend

- Angular 21
- TypeScript
- Angular Router
- Angular Reactive Forms
- Angular Material
- SCSS

### Backend

- Django 5.2
- Django-first API implementation with lightweight DRF integration for authentication and JSON responses
- SimpleJWT
- PostgreSQL 15
- Redis 7

### Infrastructure

- Docker Compose
- NGINX

## Project Vision

I approached PromptVault as a high-end digital gallery rather than a plain prompt database. Since the domain is AI-generated image prompts, the product naturally benefits from a visually driven library experience. I wanted the interface to feel like a focused workspace for collecting and exploring creative assets, not simply a form plus table layout.

That thinking led to a product direction centered on discovery, curation, and personal collection. The result is a UI that supports browsing, filtering, saving, and revisiting prompts in a way that feels more aligned with creative tooling than with a traditional admin panel.

## Frontend and UI Approach

The frontend direction was shaped as a technical design journey rather than a styling pass at the end.

I started by looking at Pinterest because it solves the exact interaction problem this product has: how to explore a large visual library without introducing clutter. The Pinterest metaphor influenced the overall UX logic of the application:

- a gallery-like browsing experience
- contextual movement between tags
- a strong “save to vault” mental model

This inspiration informed the structure of the dashboard, the relationship between the list and detail views, and the idea that prompts should feel collectible rather than disposable.

I then refined the visual language through broader research into premium dark interfaces and modern SaaS tooling. The palette was built around `#E60023` as the primary action color, paired with `#111111` and `#FFFFFF` for clarity and contrast. Accent usage was kept deliberate so actions and technical indicators would feel tactile rather than noisy.

Before implementation, I treated the visual direction as a cohesive design system. The login screen overlay, prompt card motion, spacing rhythm, type hierarchy, and interaction states were all considered together. Typography pairing centered on `Urbanist` for sharper, geometric headings, supported by a functional secondary face for longer prompt content and metadata.

This process helped me avoid a generic interface and instead build a UI that feels closer to a professional creative workspace.

View-only Figma file: [PromptVault Figma](https://www.figma.com/design/cLQxjyzH02hSmmmxziSQnS/PromptVault?node-id=0-1&t=rAu52UB1wnHXc4Ew-1)

### Why I Organized the Angular Code This Way

One of the important points in the assignment was to explain the Angular architecture clearly. I organized the frontend around user-facing responsibilities rather than around too many abstract layers, because the project is large enough to require structure but still small enough that over-engineering would reduce clarity.

The application uses Angular standalone components and route-based composition. I separated the main experiences cleanly:

- `login`
- `dashboard`
- `dashboard/:id`
- `dashboard/new`
- `bookmarks`

The key components are responsibility-driven:

- `prompt-list` handles gallery browsing, filtering, pagination, bookmarks mode, and analytics integration
- `prompt-detail` focuses on a single prompt experience
- `prompt-form` manages validated prompt creation
- `analytics-sidebar` presents tag-aware summary metrics
- `top-nav` handles search, identity display, and signout

The routing layer itself is intentionally thin. Each route loads a focused standalone component, which keeps the route configuration easy to read and makes screen-level responsibilities explicit. This fits Angular well because standalone components let each screen declare only the imports it actually needs instead of routing everything through a larger shared module.

I kept API access inside services so the routed components remain focused on state and rendering, not on request construction. This separation was especially important in Angular because it kept the components easier to reason about and prevented authentication, filtering, and request logic from spreading across the UI.

Concretely, the frontend code is organized around a few clear layers:

- `models/` defines the TypeScript contracts for prompts, tags, analytics, and paginated responses
- `services/` centralizes HTTP communication and session/auth state
- `components/` contains the routed screens and focused UI sections
- `guards/` and `interceptors/` handle navigation protection and request-level token behavior

This structure helped keep the code predictable. For example:

- `prompt.service.ts` owns prompt list, detail, create, like, bookmark, and analytics requests
- `auth.service.ts` owns signup, login, token persistence, refresh, and logout
- the auth interceptor is responsible for attaching the JWT access token and retrying a request after token refresh
- the auth guard is responsible for protecting routes such as prompt creation and bookmarks

This means the components mostly deal with UI state such as `isLoading`, active tag selection, pagination state, route navigation, and form state, while the networking details stay reusable and centralized.

I chose this structure for three main reasons:

- it keeps each routed screen self-contained and understandable
- it separates rendering concerns from API concerns
- it makes future feature expansion easier without introducing unnecessary module complexity

Search behavior was also implemented carefully from a frontend perspective. Rather than firing a request on every keystroke, I added debouncing and duplicate suppression so the experience stays responsive while avoiding avoidable backend traffic.

The prompt form is a good example of this balance. I used Angular Reactive Forms because the assignment explicitly required validation, and reactive forms made it straightforward to express validation rules, touched/dirty state, step-wise progression, and API error mapping in a structured way. That kept form validation close to the UI, while the actual submission logic remained in the service layer.

## Backend Approach

The backend was designed to satisfy the assignment requirements first, then extend naturally into bonus functionality without becoming fragmented.

Django was a strong fit for this exercise because it offers:

- a clear ORM model
- straightforward routing
- built-in admin capabilities
- simple database migrations
- reliable integration with PostgreSQL

I kept the domain centered in a single focused app, `prompts`, because the project’s business logic remains cohesive. Splitting a project of this size into too many apps would have added ceremony without improving clarity.

### Backend Responsibilities

The backend currently supports:

- prompt listing with filtering, pagination, and search
- prompt detail retrieval
- prompt creation with validation
- tag retrieval
- likes and bookmarks
- bookmark collection retrieval
- analytics aggregation
- signup, login, refresh, and signout

At the API layer, I used focused class-based views so each endpoint stays explicit and easy to follow. For an assignment project, this makes the backend behavior very readable because each view corresponds directly to a product capability rather than hiding logic behind heavier abstractions.

### Data and Logic Design

Core models:

- `Prompt` stores the main prompt record
- `Tag` supports prompt categorization
- `PromptLike` stores per-user like state
- `PromptBookmark` stores per-user bookmark state

This model design keeps the core prompt entity simple while moving user-specific engagement into dedicated relational tables. That avoids inflating the prompt record itself and makes interactions such as likes and bookmarks easier to reason about.

The key backend decisions were:

- PostgreSQL as the durable relational source of truth
- Redis as the source of truth for prompt view counts
- JWT protection for write-oriented actions while keeping prompt browsing public
- server-side search across title, content, and tags
- backend pagination to support scalable browsing
- backend-driven analytics so the frontend receives already-derived metrics

Redis was particularly important because the assignment explicitly required live prompt retrieval counts without writing to PostgreSQL on every read. That behavior is implemented at the prompt detail endpoint level, where each detail request increments the Redis counter and returns the live `view_count` in the response.

### Backend Code Organization

The backend code remains intentionally direct:

- `models.py` defines the prompt, tag, like, and bookmark relationships
- `views.py` contains endpoint logic, request validation, auth-specific behavior, and analytics computation
- `urls.py` maps feature routes explicitly
- `admin.py` exposes the models through Django admin for inspection and debugging
- `seed.py` provides repeatable database seeding for evaluation and testing

I preferred this organization because the assignment specifically emphasized a working, clean solution. Instead of introducing extra architectural layers too early, I focused on keeping the flow of data and behavior easy to inspect.

Validation is handled close to the endpoint logic so the business rules stay visible in one place. This includes:

- prompt title and content validation
- complexity range enforcement
- curated tag validation and tag count limits
- signup checks for unique username and email
- login support for either username or email

On the read side, the backend is designed so the frontend can stay simpler:

- prompt list responses already include pagination metadata
- prompt payloads include like/bookmark flags for the current user
- analytics responses return already-computed percentages instead of pushing that computation into Angular
- tag responses are aligned with the curated UI taxonomy

## Feature Walkthrough

### Prompt Management

- Browse prompts in a gallery-style dashboard
- Open a prompt detail page with full content and metadata
- Create new prompts using a reactive form
- Validate title, content, complexity, and tag selection

### Tagging and Discovery

- Tag-based filtering
- Curated trending tags in the interface
- Backend support for prompt-tag relationships
- Search across prompt title, content, and tags

### Authentication and Protected Actions

- Signup with full name, email, username, and password
- Login with either username or email
- JWT access and refresh tokens
- Authenticated signout
- Protected prompt creation
- Authenticated likes and bookmarks

### Analytics and Engagement

- Redis-backed prompt view count
- Prompt likes
- Prompt bookmarks
- Personal bookmarks page
- Tag-aware analytics endpoint

## Curated Tag Strategy

One refinement I made during implementation was limiting the user-facing tag system to a curated trending set:

- Midjourney
- UI/UX
- Editorial
- 3D-Render
- Cyberpunk
- Hyper-Real
- Minimalism

Although the backend can represent broader prompt-tag relationships, the curated set produces a cleaner browsing experience, more consistent analytics, and a tighter UI. This helped the product feel intentional rather than overly noisy.

## Project Structure

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
|-- doc/
|-- docker-compose.yml
`-- README.md
```

## Local Setup

### Run the Full Stack with Docker

From the project root:

```powershell
docker compose up --build -d
```

Application URLs:

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

## Seed Data

The project includes a seed script so the application can be evaluated with meaningful prompt data instead of placeholder records.

To load or refresh the dataset:

```powershell
docker compose exec backend python seed.py
```

The seeded data is designed to support:

- prompt browsing
- tag filtering
- search validation
- analytics visibility
- signup and authenticated flow testing

## Validation

### Backend Verification

- migrations executed successfully
- API tests cover signup, login behavior, prompt listing, likes, bookmarks, tags, and analytics
- Dockerized backend rebuilds successfully

### Frontend Verification

- Angular production build succeeds
- authenticated and unauthenticated routes behave correctly
- API-driven flows for prompt creation, search, bookmarks, and analytics are connected to the backend
- sticky header, search behavior, and authenticated identity display were verified in the running UI

## Submission Notes

- Public repository link: `https://github.com/Asgarsk01/PromptVault.git`
- View-only Figma link: [PromptVault Figma](https://www.figma.com/design/cLQxjyzH02hSmmmxziSQnS/PromptVault?node-id=0-1&t=rAu52UB1wnHXc4Ew-1)
- Public deployment URL: to be added later if included

## Final Note

My goal with this submission was not only to satisfy the assignment requirements, but to present a coherent, technically sound application that reflects clean Angular organization, dependable backend integration, thoughtful system design, and a deliberate user experience.
