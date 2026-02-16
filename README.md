# CORAL - Centralized Online Record for Attendance and Logging

CORAL is a student attendance management system designed for tracking participation in intramurals, faction events, and other academic activities. This platform provides an approach to record, monitor, and analyze student attendance data in real-time.

## What is CORAL?

CORAL (Centralized Online Record for Attendance and Logging) is a modern web-based application that allows organizers to efficiently manage attendance for university events, intramurals, and faction activities. The system eliminates the need for paper-based attendance tracking by providing digital tools for event creation, attendance recording, and data analysis.

Built with responsiveness in mind, CORAL works seamlessly across desktop and mobile devices, making it accessible for organizers on the go.

## Demo

A live demo of the system is available at: [https://checka-org.vercel.app/](https://checka-org.vercel.app/)

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
git clone https://github.com/your-username/coral-attendance.git
cd coral-attendance
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
   Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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
