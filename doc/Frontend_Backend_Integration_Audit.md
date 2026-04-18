# PromptVault Frontend vs Backend Integration Audit

This document audits the current frontend feature set against the backend that exists today.

Goal:

- identify what the frontend already supports visually
- identify what is genuinely backed by real API behavior
- identify what is currently mocked, local-only, or partially wired
- list what backend work would be needed to make each feature production-real

This audit is based on the current code in:

- `frontend/src/app/*`
- `backend/prompts/*`
- `backend/backend/urls.py`

---

# 1. Current Backend API Surface

These are the backend endpoints that actually exist today.

## Public endpoints

- `GET /api/prompts/`
- `GET /api/prompts/<id>/`
- `GET /api/tags/`

## Auth endpoints

- `POST /api/auth/token/`
- `POST /api/auth/token/refresh/`

## Protected endpoints

- `POST /api/prompts/`

Important note:

- the backend supports tag filtering through `GET /api/prompts/?tag=<name>`
- the backend does **not** currently implement pagination even though the frontend sends `page` and `limit`

---

# 2. Current Backend Data Model

The backend currently stores:

## `Prompt`

- `id`
- `title`
- `content`
- `complexity`
- `created_at`
- many-to-many `tags`

## `Tag`

- `id`
- `name`

## Runtime-derived data

- `view_count` from Redis

Important missing backend fields/tables:

- no `like_count` in database
- no bookmark model
- no per-user likes
- no prompt image/thumbnail
- no author/owner field on prompt
- no password reset flow
- no signup endpoint
- no analytics aggregation endpoint

---

# 3. Feature Audit Summary

## Fully backed by backend today

- Login with existing user credentials
- JWT token refresh
- Prompt list fetch
- Prompt detail fetch
- Tag list fetch
- Tag filtering
- Prompt creation
- Prompt view count increment on detail page

## Partially backed or mismatched

- Dashboard prompt loading with infinite scroll
- Sidebar tag selection
- Create form trending tags
- Search UX
- Bookmarks page routing
- Analytics percentages

## Frontend-only or mocked right now

- Sign-up form mode
- Forgot password flow
- Like feature
- Bookmark feature
- Saved prompts analytics
- Search behavior
- Some analytics values

---

# 4. Detailed Feature-by-Feature Audit

## 4.1 Login

### Frontend behavior

Files:

- `frontend/src/app/components/login/login.component.ts`
- `frontend/src/app/services/auth.service.ts`

What currently works:

- login form accepts username/password
- JWT tokens are stored in `localStorage`
- refresh token flow exists
- logout works

### Backend status

Supported now:

- yes

Existing endpoint:

- `POST /api/auth/token/`

Verdict:

- fully backed for login only

---

## 4.2 Sign-up

### Frontend behavior

The login screen now has sign-up mode with:

- full name
- email
- username
- password

But the submit path still calls:

- `authService.login(username, password)`

That means sign-up is only a UI mode right now.

### Backend status

Supported now:

- no

Missing backend pieces:

- user registration endpoint
- server-side validation for username/email uniqueness
- optional name/email storage logic if custom handling is needed

Suggested endpoint:

- `POST /api/auth/signup/`

Suggested request body:

```json
{
  "full_name": "Adam Stone",
  "email": "adam@example.com",
  "username": "adam",
  "password": "secret"
}
```

Suggested response:

- created user
- optionally immediate access + refresh tokens

Verdict:

- frontend-only at the moment

---

## 4.3 Forgot Password

### Frontend behavior

The forgot-password screen exists and shows a success state.

But it is intentionally dummy:

- no API call is made
- a timer simulates completion

### Backend status

Supported now:

- no

Your stated intent:

- keep it dummy for now
- do not integrate backend yet

Verdict:

- intentionally frontend-only mock

No backend work is needed unless you later decide to make it real.

If you later want real reset support, you would need:

- password reset request endpoint
- token generation
- email sending
- password reset confirm endpoint

---

## 4.4 Prompt List / Dashboard

### Frontend behavior

Files:

- `frontend/src/app/components/prompt-list/prompt-list.component.ts`
- `frontend/src/app/components/prompt-list/prompt-list.component.html`

The dashboard now includes:

- custom route `/dashboard`
- infinite scroll sentinel
- sorting toggle
- layout toggle
- analytics sidebar
- bookmark view route

### Backend status

Prompt list fetch itself is supported through:

- `GET /api/prompts/`

But there is one integration mismatch:

- frontend sends `page` and `limit`
- backend ignores both

Current frontend call:

```ts
getPrompts(tag?: string, page: number = 1, limit: number = 12)
```

Current backend behavior:

- returns all prompts always
- does not paginate

Verdict:

- partially backed

Needed backend work for true infinite scroll:

- support `page`
- support `limit`
- return paginated results or cursor-based results

Suggested endpoint shape:

- `GET /api/prompts/?tag=cyberpunk&page=1&limit=12`

Suggested response shape:

```json
{
  "results": [...],
  "page": 1,
  "limit": 12,
  "has_more": true,
  "total": 84
}
```

Right now the frontend is faking pagination on top of a non-paginated backend.

---

## 4.5 Tag Filtering

### Frontend behavior

Filtering is triggered from:

- analytics sidebar tags
- prompt list filter flow

### Backend status

Supported now:

- yes, for real tag names that exist in the backend

Existing endpoint:

- `GET /api/prompts/?tag=<name>`

Important caveat:

The sidebar tag list is currently hardcoded as:

- `Midjourney`
- `UI/UX`
- `Editorial`
- `3D-Render`
- `Cyberpunk`
- `Hyper-Real`
- `Minimalism`

But backend tags currently come from database values like:

- `cyberpunk`
- `anime`
- `fantasy`
- `portrait`
- `landscape`
- `scifi`

So:

- `Cyberpunk` works because backend filtering is case-insensitive
- many other sidebar tags do not correspond to real backend tags

Verdict:

- backend supports tag filtering
- frontend tag source is partly mocked/hardcoded

Needed backend/frontend alignment:

- either fetch real tags from `/api/tags/`
- or create those missing tags in the database

Best production approach:

- sidebar tags should come from backend, not hardcoded strings

---

## 4.6 Analytics Sidebar

### Frontend behavior

Files:

- `frontend/src/app/components/analytics-sidebar/analytics-sidebar.ts`

The sidebar shows:

- trending %
- most viewed %
- most liked %
- saved prompts count

Current logic:

- values are hardcoded or randomized in `updateAnalytics()`
- they are not calculated from backend data

### Backend status

Supported now:

- partially

Available backend data:

- prompts
- tags
- prompt view counts

Missing backend data:

- likes
- bookmarks
- analytics aggregates

### Your specific requirement

You said analytics should work like this:

- if selected tag is `All`, show overall percentages
- if a specific tag is selected, show stats for that tag only

This can be handled in two possible ways.

### Option A: frontend-computed analytics

This is possible if:

- frontend has the full prompt dataset
- all needed metrics are already present in prompt data

Right now only this is truly available:

- views per prompt
- tags per prompt

So today, frontend could compute:

- total prompts for selected tag
- total views for selected tag
- percentage share of prompts by selected tag relative to all prompts

But it cannot correctly compute:

- likes
- bookmarks

because that data does not exist in backend storage.

### Option B: backend analytics endpoint

This is the better long-term approach, especially if pagination remains.

Suggested endpoint:

- `GET /api/analytics/overview/`
- `GET /api/analytics/overview/?tag=cyberpunk`

Suggested response:

```json
{
  "tag": "cyberpunk",
  "prompt_count": 12,
  "view_total": 482,
  "like_total": 93,
  "bookmark_total": 28,
  "trending_percent": 64,
  "most_viewed_percent": 71,
  "most_liked_percent": 55
}
```

Verdict:

- current analytics are frontend mock values
- for your requested selected-tag percentages, backend analytics support is strongly recommended

---

## 4.7 Likes

### Frontend behavior

The dashboard supports:

- clicking heart icon
- toggling liked visual state
- incrementing/decrementing `prompt.like_count`

Current implementation:

- uses local `Set<number>`
- mutates optional `like_count` on the prompt object in memory

This means:

- likes are not persisted
- likes reset on reload
- likes are not user-specific in backend

### Backend status

Supported now:

- no

Missing backend pieces:

- `like_count` or derived count
- user-to-prompt like relationship
- like/unlike endpoints

Recommended model approach:

- create `PromptLike`
  - `user`
  - `prompt`
  - unique `(user, prompt)`

Recommended endpoints:

- `POST /api/prompts/<id>/like/`
- `DELETE /api/prompts/<id>/like/`

Prompt list/detail should then return:

- `like_count`
- `liked_by_current_user`

Verdict:

- frontend-only local simulation right now

---

## 4.8 Bookmarks

### Frontend behavior

The app supports:

- bookmark icon toggle
- `/bookmarks` route

Current implementation:

- bookmarks are stored in a local `Set<number>`
- bookmarks are not persisted
- bookmarks page is not a real backend bookmark query
- the current code fakes bookmark view data using:

```ts
incoming = incoming.filter((_, i) => i % 2 === 0);
```

That means the bookmarks page is currently a placeholder, not real saved content.

### Backend status

Supported now:

- no

Missing backend pieces:

- bookmark model
- bookmark create/remove endpoints
- endpoint to list only current user bookmarks

Recommended model:

- `PromptBookmark`
  - `user`
  - `prompt`
  - unique `(user, prompt)`

Recommended endpoints:

- `POST /api/prompts/<id>/bookmark/`
- `DELETE /api/prompts/<id>/bookmark/`
- `GET /api/bookmarks/`

Prompt list/detail should then return:

- `bookmarked_by_current_user`

Verdict:

- frontend-only placeholder right now

---

## 4.9 Search

### Frontend behavior

The top nav contains a search input.

Current implementation:

- visual only
- no query state
- no filtering logic
- no API call

### Backend status

Supported now:

- no dedicated search endpoint or query support

Could be implemented in two ways.

### Option A: frontend-only search

Possible if:

- searching only currently loaded prompts is acceptable

That would require no backend changes, but it would only search visible/local data.

### Option B: backend-backed search

Recommended if:

- you want real search over the full dataset
- you want search to work with pagination

Suggested endpoint support:

- `GET /api/prompts/?search=cyberpunk`

Possible backend fields to search:

- `title`
- `content`
- `tags__name`

Verdict:

- current search bar is UI-only
- backend support is needed for true search over the full vault

---

## 4.10 Prompt Detail

### Frontend behavior

Prompt detail page now includes:

- prompt title
- formatted date
- view count
- copy-to-clipboard
- complexity meter
- tags

### Backend status

Supported now:

- mostly yes

Existing endpoint:

- `GET /api/prompts/<id>/`

Available data:

- title
- content
- complexity
- tags
- created_at
- view_count

Not supported by backend:

- no image/thumbnail
- no author
- no like state
- no bookmark state

Verdict:

- detail page is well-backed for current prompt core data
- enhancement data would need backend additions

---

## 4.11 Prompt Create Flow

### Frontend behavior

The create form supports:

- 2-step wizard UI
- title
- content
- complexity slider
- tags
- success modal

### Backend status

Supported now:

- yes for core prompt creation

Existing endpoint:

- `POST /api/prompts/`

Important caveat:

The frontend injects a fallback list of trending tags such as:

- `Midjourney`
- `UI/UX`
- `Editorial`

and will submit them as plain strings even if they were not originally in backend.

The backend currently does:

- `get_or_create(name=tag_name.lower())`

So this actually works.
Those tags will be created automatically.

Verdict:

- fully backed for prompt creation
- tag taxonomy consistency may still need cleanup later

---

# 5. Feature Classification Matrix

## Real end-to-end right now

- login
- logout
- token refresh
- prompt browse
- prompt detail
- tag fetch
- tag filtering with real backend tags
- prompt creation
- view count increment

## Visually implemented but not truly backed

- sign-up
- forgot password
- like
- bookmark
- bookmarks page
- analytics percentages
- search
- infinite scroll pagination

## Partially backed and needing alignment

- analytics tag list vs backend tags
- dashboard routing vs old `/prompts` mental model
- prompt list pagination params
- optional `like_count` UI field vs missing backend source

---

# 6. Backend Work Needed to Support Add-on Features

## Priority 1: Fix core data/API mismatches

### 1. Add prompt pagination

Needed because:

- frontend already assumes it
- infinite scroll depends on it

Suggested support:

- `page`
- `limit`
- `total`
- `has_more`

### 2. Add search support

Suggested:

- `GET /api/prompts/?search=...`

Search fields:

- title
- content
- tags

### 3. Replace hardcoded analytics/tag assumptions

Suggested:

- use backend `/api/tags/` as source of truth for sidebar tag list
- or add a dedicated analytics endpoint

---

## Priority 2: Add persistent engagement features

### 4. Add likes

Need:

- model for prompt likes
- like/unlike endpoints
- like count in prompt payload
- current-user like flag

### 5. Add bookmarks

Need:

- bookmark model
- bookmark add/remove endpoints
- bookmark list endpoint
- current-user bookmark flag

### 6. Add analytics endpoint

Especially useful for your selected-tag percentage requirement.

Suggested:

- `GET /api/analytics/overview/`
- `GET /api/analytics/overview/?tag=<name>`

Should return:

- prompt totals
- views
- likes
- bookmarks
- computed percentages

---

## Priority 3: Add auth/account expansion

### 7. Add sign-up API

Need:

- user registration endpoint
- duplicate username/email validation
- optional automatic token issue on signup

### 8. Keep forgot password dummy for now

No backend needed if you want to keep it as UX-only.

If later needed:

- reset request endpoint
- token email delivery
- reset confirm endpoint

---

# 7. Recommended Implementation Strategy

If you want the fastest meaningful backend support for your new frontend, the best order is:

1. Add pagination and search to `/api/prompts/`
2. Add real analytics endpoint for selected tag / all mode
3. Add persistent likes
4. Add persistent bookmarks
5. Add signup endpoint
6. Leave forgot password dummy until later

Why this order:

- it stabilizes the dashboard first
- it makes analytics honest
- it turns visible engagement features into real features
- it avoids spending time on lower-priority auth work too early

---

# 8. Specific Note About Your Analytics Requirement

Your requested behavior was:

- if selected tag is `All`, show overall percentages
- if one tag is selected, show only that tagâ€™s analytics

Best answer:

- for a small dataset, this can be calculated on the frontend from the full prompt list if all prompts and all metrics are already loaded
- for a growing dataset, the correct production solution is a backend analytics endpoint

Because PromptVault now wants:

- infinite scroll
- search
- per-user likes/bookmarks
- tag-specific stats

the cleaner long-term design is:

- keep prompt listing endpoint focused on prompt cards
- add a separate analytics aggregation endpoint

That will make the frontend simpler and the numbers more trustworthy.
