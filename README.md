<div align="center">

# Catering Client

### The Angular frontend for the Catering Project — a premium online catering experience

A luxurious, responsive single-page application where customers browse the menu, build custom event packages, pay securely, and leave reviews.

<br />

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![SCSS](https://img.shields.io/badge/Styles-SCSS-CC6699?logo=sass&logoColor=white)](https://sass-lang.com)
[![RxJS](https://img.shields.io/badge/RxJS-7-B7178C?logo=reactivex&logoColor=white)](https://rxjs.dev)
[![PayPal](https://img.shields.io/badge/Payments-PayPal-00457C?logo=paypal&logoColor=white)](https://developer.paypal.com)

</div>

---

## About

This is the **client** side of the **Catering Project** — a full-stack final project. It is a modern Angular 21 single-page application, built entirely with standalone components and signals, that consumes a REST API for all data and business logic.

This repository is one of two that make up the project:

| Part | Repository |
|------|-----------|
| **Client** (this repo) | [tehila4510/catering-client](https://github.com/tehila4510/catering-client) |
| **Server** (REST API) | [TEHILA5/catering-server](https://github.com/TEHILA5/catering-server) |
| **General overview** | [tehila4510/Catering_Project](https://github.com/tehila4510/Catering_Project) |

> This client talks to the backend API. To run the full experience, start the [server](https://github.com/TEHILA5/catering-server) first (see [Getting Started](#getting-started)).

## Features

### Customer
- **Menu browsing** — dishes organized by category (starters, main courses, salads, desserts, breads, drinks).
- **Event packages** — per-person pricing, minimum guest counts, and per-category dish limits.
- **Custom order flow** — pick your dishes within package limits, set the event date, guest count, and address.
- **PayPal payments** — secure checkout with automatic order confirmation.
- **Reviews & ratings** — star ratings and comments for packages you've ordered.
- **Authentication** — register, log in, and manage your profile with JWT-secured sessions.
- **AI agent chat widget** — an in-app assistant that helps customers navigate the site.

### Admin
- **Protected dashboard** — role-based access via route guards.
- **Manage dishes, packages, orders, and customers** from a single admin area.

## Tech Stack

- **Angular 21** — standalone components, signals (`input()`, `output()`, `signal()`, `computed()`), modern control flow (`@if`, `@for`, `@switch`)
- **TypeScript** (strict mode, zero `any`)
- **SCSS** — centralized design tokens and a luxury gold / black / white theme
- **RxJS** + Angular `HttpClient`
- **PayPal JS SDK** for payments
- **Vitest** for unit testing, **ESLint** + **Prettier** for code quality

## Design System

A consistent luxury theme drives the UI:

| Token | Value | Use |
|-------|-------|-----|
| Gold | `#C9A84C` | Primary accent |
| Black | `#111111` | Background |
| Black Soft | `#1E1E1E` | Cards |
| White | `#F9F9F9` | Text |

Typography: **Playfair Display** for headings and **Inter** for body/UI. Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) (LTS recommended)
- [Angular CLI](https://angular.dev/tools/cli)
- The [Catering Server](https://github.com/TEHILA5/catering-server) running locally

### 1. Run the backend API

The client expects the API at `http://localhost:3000/api`. Clone and start the server first:

```bash
git clone https://github.com/TEHILA5/catering-server.git
cd catering-server
npm install
npm run dev
```

### 2. Run the client

```bash
npm install
ng serve
```

Open your browser at `http://localhost:4200`. The app reloads automatically when you change source files.

## Available Scripts

| Command | Description |
|---------|-------------|
| `ng serve` | Start the local development server on port 4200 |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run watch` | Build in watch mode (development configuration) |
| `npm run test` | Run unit tests with Vitest |
| `npm run lint` | Lint the project with ESLint |

## Configuration

API and payment settings live in `src/environments/`:

- `environment.ts` — development configuration (`apiUrl`, PayPal client ID)
- `environment.prod.ts` — production configuration

The PayPal **client ID** is public and safe to expose on the frontend; the PayPal **secret** stays on the server only.

## Project Structure

```
src/app/
├── core/          # Guards, interceptors, models, and singleton services (auth, token, toast)
├── shared/        # Reusable components (navbar, footer, cards, loader, chat widget)
└── features/      # Feature areas: home, dishes, packages, orders, reviews, auth, admin
```

## Author

Built with care by **Tehila** — see the [general project overview](https://github.com/tehila4510/Catering_Project) for the full picture.
