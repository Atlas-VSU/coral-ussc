# CORAL - Centralized Online Record for Attendance and Logging

## USSC Instance

This is the CORAL deployment for the University Student Supreme Council (USSC). CORAL is a student attendance management system designed for tracking participation in intramurals, faction events, and other academic activities. This platform provides an approach to record, monitor, and analyze student attendance data in real-time.

## What is CORAL?

CORAL (Centralized Online Record for Attendance and Logging) is a modern web-based application that allows organizers to efficiently manage attendance for university events, intramurals, and faction activities. The system eliminates the need for paper-based attendance tracking by providing digital tools for event creation, attendance recording, and data analysis.

Built with responsiveness in mind, CORAL works seamlessly across desktop and mobile devices, making it accessible for organizers on the go.

## Deployment

This instance is specifically configured for USSC with dedicated Firebase credentials and database configuration.

## Version 1.1.0

The latest release introduces significant UI/UX improvements, enhanced responsiveness, and better user experience across all devices. Key improvements include:

- Responsive member card designs with both regular and compact views
- Improved bulk import functionality with better mobile support
- Enhanced authentication flow and navigation
- Fixed layout issues in forms and dialogs
- Comprehensive documentation updates

### Key Features

1. **Authentication**

   - Secure user login and registration system
   - Role-based access control with organization-specific permissions
   - Password recovery functionality
   - Optimized navigation for authenticated and non-authenticated users
   - (Note: External authentication providers like Google Sign-in will be added in future versions)

2. **Dashboard**

   - At-a-glance attendance statistics and metrics
   - Interactive graphs displaying attendance trends
   - Quick access to recently created events
   - Recently added members/students list
   - Responsive design for all screen sizes

3. **Event Management**

   - Create, update, and archive events
   - Configure event details: name, date, time-in/time-out ranges
   - Designate events as major or minor
   - Add descriptive notes and event information
   - Mobile-friendly event creation and management
   - (Calendar view of upcoming and past events will be added in the fture)

4. **Attendee Tracking**

   - Comprehensive attendee lists for each event
   - Timestamp recording for check-in/check-out
   - Attendance status visualization
   - Exportable attendance records
   - Search and filter capabilities

5. **Attendance Logging**

   - Simple check-in process via student ID or name
   - Real-time display of checked-in students
   - Search and filter functionality
   - Loading skeletons for improved user experience
   - (Coming soon: kiosk mode, self check-in, and QR scanning)

6. **Member Management**
   - Bulk import functionality with downloadable templates
   - Manual member addition with responsive forms
   - Searchable member directory with instant results
   - Pagination for large member lists
   - Multiple view options (standard and compact card layouts)
   - Mobile-optimized member management interface

## Recent Improvements

### UI/UX Enhancements

- **Member List Component**: Completely redesigned with responsive card layouts, proper spacing, and pagination
- **Bulk Import Dialog**: Fixed layout issues, improved mobile experience, and enhanced file upload section
- **Navigation**: Improved header behavior based on authentication status
- **Loading States**: Added skeleton loaders to replace static messages or content

### Component Architecture

- Refactored large components into smaller, focused ones for better maintainability
- Created reusable components for lists, cards, search, and pagination
- Implemented proper responsive design with tailored mobile and desktop experiences

### Documentation

- Comprehensive README with detailed project information
- Clear feature documentation and system capabilities
- Updated deployment information and technology stack details

## Coming Soon

- Admin portal for system-wide configuration
- QR code-based check-in system
- Self-service attendance kiosk mode
- Mobile application for on-the-go attendance tracking
- Advanced reporting and analytics
- Integration with university information systems

## Getting Started

### Prerequisites

- Node.js 16.8 or later
- npm, yarn, or pnpm package manager
- A Firebase project (for authentication and database)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/Atlas-VSU/coral-ussc.git
cd coral-ussc
```

2. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
   
   Copy the example environment file and configure it with your USSC Firebase credentials:
   
   ```bash
   cp .env.local.example .env.local
   ```
   
   Then edit `.env.local` with your Firebase configuration. You'll need both client and admin SDK credentials:
   
   **Client SDK (Browser-side):**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
   
   **Admin SDK (Server-side):**
   ```
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
   
   > **Important:** Never commit your `.env.local` file to version control. It contains sensitive credentials.

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup Guide

To obtain the required Firebase credentials for the USSC instance:

### Client SDK Configuration

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your USSC project (or create a new one)
3. Click on the gear icon ⚙️ next to "Project Overview" and select "Project settings"
4. Scroll down to "Your apps" section
5. If you haven't added a web app, click the web icon (</>) to add one
6. Copy the Firebase configuration object - these are your `NEXT_PUBLIC_FIREBASE_*` values

### Admin SDK Configuration

1. In Firebase Console, go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file (keep it secure!)
4. Extract the following values from the JSON:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and newlines)

### Firestore Database Setup

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose production mode (or test mode for development)
4. Select a location close to your users
5. The database will be created with the required security rules

### Firebase Authentication Setup

1. In Firebase Console, go to Authentication
2. Click "Get started" if not already enabled
3. Enable the sign-in methods you want to use (Email/Password is required)
4. Configure authorized domains for your deployment

## Technology Stack

- **Frontend Framework**: Next.js 14 (App Router)
- **UI Component Library**: ShadcnUI with Tailwind CSS
- **State Management**: React Context API
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **Language**: TypeScript
- **Styling**: Tailwind CSS with responsive design
- **Form Handling**: React Hook Form with Zod validation
- **Deployment**: Vercel

## Project Structure

```
src/
├── app/                  # Next.js App Router structure
│   ├── (auth)/           # Authentication related pages
│   ├── (dashboard)/      # Dashboard and authenticated features
│   └── (public)/         # Public facing pages
├── components/           # Shared UI components
│   ├── NavBar/           # Navigation components
│   └── ui/               # Basic UI elements (shadcn)
├── features/             # Feature-based organization
│   ├── auth/             # Authentication related components
│   ├── dashboard/        # Dashboard components and logic
│   ├── events/           # Event management features
│   └── organization/     # Organization and member management
└── lib/                  # Utility functions and shared logic
```

## Development Team

CORAL is being developed as a student project aimed at improving attendance tracking systems for educational institutions. The system is built with scalability and extensibility in mind, allowing for future enhancements and integrations.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed for educational and non-commercial use only.
