# Millennial Task Management System — Frontend

A **Next.js 16 (App Router)** project for managing projects, tasks, work logs, and team collaboration with real-time SSE notifications, Cloudinary media uploads, and a premium UI with dark mode.

---

## Tech Stack

| Layer         | Technology                              |
|---------------|-----------------------------------------|
| Framework     | Next.js 16 (App Router, Turbopack)      |
| Language      | TypeScript                              |
| Styling       | Vanilla CSS (CSS variables, dark mode)  |
| State         | React `useState` / `useEffect`          |
| Real-time     | Server-Sent Events (SSE)               |
| Media         | Cloudinary (images & PDF uploads)       |
| Auth          | JWT stored in `localStorage`            |

---

## Features

- **Debounced Search (400 ms)** — Applied on Tasks and Activity Logs pages to avoid re-filtering on every keystroke.
- **Infinite Scroll** — Activity Logs load 20 more items on scroll-to-bottom.
- **Real-time Notifications** — SSE stream from the worker service; toasts + notification bell.
- **Avatar System** — Cloudinary profile picture with DiceBear fallback.
- **Work-log Attachments** — Images and PDFs uploaded directly to Cloudinary.
- **Admin Verification Flow** — New users show a **Verify** button; login is blocked until verified.
- **Reports Dashboard** — Hours logged (rounded), task breakdown by project, recent activity.
- **Global Navbar Search** — Search bar (`name="globalSearch"`) in the top navigation.

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- npm

### Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd millennial-frontned
   ```

2. **Install dependencies**
   ```bash
   npm ci
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the values (see table below):

   | Variable                  | Description                          | Example                        |
   |---------------------------|--------------------------------------|--------------------------------|
   | `NEXT_PUBLIC_API_URL`     | Base URL of the Spring Boot backend  | `http://localhost:8080`        |
   | `NEXT_PUBLIC_WORKER_URL`  | Base URL of the worker service       | `http://localhost:8081`        |
   | `CLOUDINARY_CLOUD_NAME`   | Your Cloudinary cloud name           | `your_cloud_name`              |
   | `CLOUDINARY_API_KEY`      | Your Cloudinary API key              | `your_api_key`                 |
   | `CLOUDINARY_API_SECRET`   | Your Cloudinary API secret           | `your_api_secret`              |

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app runs at **http://localhost:3000**.

---

## Architecture Decisions

- **Turbopack** — Faster builds in dev; cache is cleared automatically when internal errors occur.
- **Debounce** — `setTimeout` inside `useEffect` delays `query` state updates by 400 ms from raw `searchTerm`.
- **Infinite Scroll** — Scroll container threshold (`scrollHeight - scrollTop <= clientHeight + 80`) loads more entries.
- **SSE Notifications** — `EventSource` opened per authenticated user; reconnects automatically on error.
- **Cloudinary API Route** — `/api/upload` Next.js route signs and proxies uploads to avoid exposing the secret in the browser.

---

## Assumptions

- Three roles: `admin`, `manager`, `employee`.
- All timestamps are UTC on the server and displayed via `timeAgo()` client-side.
- JWT is stored in `localStorage` under the key `pms-auth-token`.
- Cloudinary is used for all media (profile pictures, work-log attachments).

---

## Available Scripts

| Command         | Description                   |
|-----------------|-------------------------------|
| `npm run dev`   | Start the dev server          |
| `npm run build` | Create a production build     |
| `npm run start` | Start the production server   |
| `npm run lint`  | Run ESLint                    |
