# Attendance Logging System

> **Veris Basic Tier** · Attendance Management · ₱2 / student / year

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?logo=vercel)](https://coral-ussc.vercel.app/)
[![License](https://img.shields.io/badge/License-Educational%20Use-green)](#license)

---

## Table of Contents

- [About Veris](#about-veris)
- [Veris Basic Tier](#veris-basic-tier)
- [Features](#features)
- [Screenshots / Demo](#screenshots--demo)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Firebase Setup Guide](#firebase-setup-guide)
- [Changelog](#changelog)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Development Team](#development-team)
- [License](#license)

---

## About Veris

**Veris** is a modern, web-based attendance management system built for universities, student councils, and academic organizations. It replaces paper-based tracking with a fully digital, real-time solution for managing events, members, and attendance records.

### Veris Basic Tier

This repository hosts the **USSC (University Student Supreme Council)** deployment of Veris Basic Tier.

🔗 **Live Deployment:** [https://coral-ussc.vercel.app/](https://coral-ussc.vercel.app/)

---

## Veris Basic Tier

| Detail | Value |
|---|---|
| **Plan** | Basic — Attendance Management |
| **Price** | ₱2 / student / year |
| **Minimum** | 100 students |
| **Floor Price** | ₱200 / year |

The **Basic Tier** is designed for student organizations and councils that need a reliable, no-frills attendance management solution with all the essential tools — at an affordable per-student price.

### What's Included

| Feature | Included |
|---|---|
| Secure login | ✅ |
| Dashboard with real-time attendance trends | ✅ |
| Create & manage unlimited events | ✅ |
| Real-time attendee tracking & timestamps | ✅ |
| Quick check-in via student ID or name | ✅ |
| Member directory with bulk import | ✅ |
| Unlimited members & events | ✅ |

> **Note:** Upgrading to a higher Veris tier unlocks QR code scanning, kiosk mode, advanced analytics, multi-organization support, and priority support.

---

## Features

### 1. 🔐 Authentication
- Secure email/password login and registration
- Role-based access control with organization-specific permissions
- Password recovery functionality
- Optimized navigation for authenticated and guest users

### 2. 📊 Dashboard
- Real-time attendance statistics and metrics
- Interactive graphs displaying attendance trends over time
- Quick access to recently created events
- Recently added members/students list
- Fully responsive across all screen sizes

### 3. 📅 Event Management
- Create, update, and archive unlimited events
- Configure event details: name, date, time-in/time-out windows
- Designate events as major or minor
- Add notes and descriptive event information
- Mobile-friendly event creation and management

### 4. 👥 Real-Time Attendee Tracking
- Comprehensive attendee lists per event
- Timestamp recording for check-in and check-out
- Attendance status visualization
- Exportable attendance records
- Search and filter capabilities

### 5. ✅ Quick Check-In
- Simple check-in via student ID or full name
- Real-time display of checked-in students
- Search and filter functionality
- Loading skeleton states for better UX

### 6. 📋 Member Directory
- Bulk import functionality with downloadable CSV templates
- Manual member addition via responsive forms
- Searchable member directory with instant results
- Pagination support for large member lists
- Multiple card view options (standard and compact layouts)
- Mobile-optimized interface

---

## Screenshots / Demo

> _Screenshots and GIF walkthroughs will be added here in a future update._

🔗 Try the live system at [https://coral-ussc.vercel.app/](https://coral-ussc.vercel.app/)

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Components** | ShadcnUI |
| **Styling** | Tailwind CSS |
| **State Management** | React Context API |
| **Authentication** | Firebase Authentication |
| **Database** | Firebase Firestore |
| **Form Handling** | React Hook Form + Zod |
| **Deployment** | Vercel |

---

## Project Structure

```
coral-ussc/
├── public/                   # Static assets
├── src/
│   ├── app/                  # Next.js App Router structure
│   │   ├── (auth)/           # Authentication pages (login, register, reset)
│   │   ├── (dashboard)/      # Protected dashboard and feature pages
│   │   └── (public)/         # Public-facing landing pages
│   ├── components/           # Shared/reusable UI components
│   │   ├── NavBar/           # Navigation bar components
│   │   └── ui/               # Base UI elements (shadcn)
│   ├── features/             # Feature-based organization
│   │   ├── auth/             # Authentication components and logic
│   │   ├── dashboard/        # Dashboard widgets and charts
│   │   ├── events/           # Event management features
│   │   └── organization/     # Member/organization management
│   └── lib/                  # Utility functions and shared logic
├── .env.local.example        # Environment variable template
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
└── tsconfig.json             # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** 16.8 or later
- **npm**, **yarn**, or **pnpm**
- A **Firebase** project (for authentication and Firestore database)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Atlas-VSU/coral-ussc.git
cd coral-ussc
```

2. **Install dependencies:**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Configure environment variables** (see [Environment Variables](#environment-variables))

4. **Run the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

### Client SDK (Browser-side)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Admin SDK (Server-side)

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ **Never commit `.env.local` to version control.** It contains sensitive credentials. It is already listed in `.gitignore`.

---

## Firebase Setup Guide

### Client SDK

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Navigate to **Project Settings** → **Your apps**
4. Add or select a web app and copy the config object — these are your `NEXT_PUBLIC_FIREBASE_*` values

### Admin SDK

1. In Firebase Console, go to **Project Settings → Service Accounts**
2. Click **Generate new private key** and download the JSON file
3. Extract `project_id`, `client_email`, and `private_key` into your `.env.local`

### Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database** and select **Production mode**
3. Choose a region closest to your users

### Firebase Authentication

1. In Firebase Console, go to **Authentication → Sign-in method**
2. Enable **Email/Password** authentication
3. Add your deployment domain to **Authorized domains**

---

## Changelog

### v1.2.1 — Latest

- ✨ Responsive member card designs (standard and compact views)
- ✨ Improved bulk import with better mobile support
- 🐛 Fixed layout issues in forms and dialogs
- 🔧 Enhanced authentication flow and navigation
- 📝 Comprehensive documentation update

### v1.2.0

- 🚀 Initial public deployment of USSC instance
- 📊 Dashboard with real-time attendance charts
- 👥 Full member management and bulk import
- 📅 Event creation and attendee tracking

---

## Roadmap

The following features are planned for upcoming Veris tiers and releases:

- [ ] QR code-based check-in system
- [ ] Self-service attendance kiosk mode
- [ ] Google Sign-in (OAuth)
- [ ] Admin portal for system-wide configuration
- [ ] Mobile application (iOS & Android)
- [ ] Advanced reporting and analytics exports
- [ ] Calendar view for events
- [ ] Integration with university information systems
- [ ] Multi-organization / multi-council support

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to your branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and include meaningful commit messages.

---

## Development Team

Veris is spearheaded by the Faculty of Computing - Supreme Student Council (FC-SSC) of Academic Year 2025-2026 aimed at improving attendance tracking systems for educational institutions. The system is built with scalability and extensibility in mind, allowing for future enhancements across Veris service tiers.

---

## License

This project is licensed for **educational and within VSU use only**.

© 2026 Veris Basic Tier · Faculty of Computing - Supreme Student Council (FC-SSC)
