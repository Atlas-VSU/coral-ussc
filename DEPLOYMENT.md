# CORAL-USSC Deployment Guide

This guide provides step-by-step instructions for deploying the CORAL application for the University Student Supreme Council (USSC).

## Prerequisites

Before you begin, ensure you have:

- A Firebase project set up specifically for USSC
- Access to the Firebase Console
- A Vercel account (or other hosting platform)
- Administrative access to your deployment environment

## Step 1: Firebase Project Setup

### 1.1 Create a New Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter a project name (e.g., "coral-ussc")
4. Accept the terms and click "Continue"
5. Disable Google Analytics (optional for this project)
6. Click "Create project"

### 1.2 Enable Firestore Database

1. In your Firebase project, navigate to "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select production mode for production or test mode for development
4. Choose a Cloud Firestore location (preferably close to your users, e.g., asia-southeast1)
5. Click "Enable"

### 1.3 Enable Authentication

1. Navigate to "Authentication" in the left sidebar
2. Click "Get started"
3. Under "Sign-in method", enable "Email/Password"
4. Configure other authentication providers if needed
5. Add your domain to the authorized domains list (e.g., your-domain.vercel.app)

### 1.4 Get Client SDK Configuration

1. In Project Settings (⚙️ icon), scroll to "Your apps"
2. Click the web icon (`</>`) to add a web app
3. Register your app with a nickname (e.g., "CORAL-USSC Web")
4. Copy the Firebase configuration object
5. Save these values - you'll need them for environment variables

### 1.5 Generate Admin SDK Private Key

1. In Project Settings, go to "Service accounts" tab
2. Click "Generate new private key"
3. Click "Generate key" in the dialog
4. Save the downloaded JSON file securely (never commit this to version control!)
5. Extract the following from the JSON:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 2: Local Development Setup

### 2.1 Clone the Repository

```bash
git clone https://github.com/Atlas-VSU/coral-ussc.git
cd coral-ussc
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and fill in your Firebase credentials:

```env
# Client SDK (from Step 1.4)
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coral-ussc.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coral-ussc
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coral-ussc.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Admin SDK (from Step 1.5)
FIREBASE_PROJECT_ID=coral-ussc
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@coral-ussc.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Actual_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

**Important:** Keep the quotes and `\n` characters in the private key exactly as shown.

### 2.4 Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to test the application locally.

## Step 3: Vercel Deployment

### 3.1 Connect to Vercel

1. Go to [Vercel](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `Atlas-VSU/coral-ussc`
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3.2 Configure Environment Variables in Vercel

1. In the Vercel project settings, go to "Environment Variables"
2. Add each environment variable from your `.env.local` file:
   - Click "Add New"
   - Enter the variable name (e.g., `NEXT_PUBLIC_FIREBASE_API_KEY`)
   - Enter the value
   - Select environments: Production, Preview, Development
   - Click "Save"

3. Repeat for all variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

**Important:** For `FIREBASE_PRIVATE_KEY`, paste the entire key including the BEGIN and END markers and with `\n` preserved.

### 3.3 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Once deployed, you'll get a URL (e.g., `coral-ussc.vercel.app`)

### 3.4 Update Firebase Authorized Domains

1. Return to Firebase Console
2. Go to Authentication > Settings > Authorized domains
3. Add your Vercel domain (e.g., `coral-ussc.vercel.app`)

## Step 4: Post-Deployment Configuration

### 4.1 Create the First Admin User

1. Visit your deployed application
2. Register a new account with your USSC admin email
3. In Firebase Console, go to Authentication
4. Find your user and note the UID
5. In Firestore Database, create a new collection called `users` (if not exists)
6. Add a document with your UID as the document ID
7. Set appropriate fields like:
   ```json
   {
     "email": "admin@ussc.edu",
     "role": "admin",
     "displayName": "USSC Admin",
     "createdAt": "2026-02-16T00:00:00.000Z"
   }
   ```

### 4.2 Configure Firestore Security Rules

1. In Firebase Console, go to Firestore Database
2. Click on "Rules" tab
3. Update the rules according to your security requirements
4. Publish the rules

Example basic rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more rules for events, attendance, etc.
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Adjust based on your role system
    }
  }
}
```

## Step 5: Verification

### 5.1 Test Authentication

1. Try registering a new user
2. Try logging in with the user
3. Test password reset functionality

### 5.2 Test Core Features

1. Create a test event
2. Add test members/students
3. Log attendance for the event
4. Verify data is being saved to Firestore

### 5.3 Monitor Performance

1. Check Vercel Analytics for application performance
2. Monitor Firebase Console for database usage
3. Check Firebase Authentication for user activity

## Troubleshooting

### Build Fails

- Verify all environment variables are set correctly in Vercel
- Check that there are no syntax errors in your `.env.local` file
- Ensure the `FIREBASE_PRIVATE_KEY` includes the full key with proper formatting

### Authentication Not Working

- Verify your domain is added to Firebase Authorized Domains
- Check that all `NEXT_PUBLIC_FIREBASE_*` variables are correct
- Ensure Firebase Authentication is enabled

### Database Connection Issues

- Verify Firestore is enabled in your Firebase project
- Check that `FIREBASE_PROJECT_ID` matches your Firebase project
- Ensure the service account has proper permissions

### Private Key Format Issues

- The private key must be in quotes
- Keep the `\n` characters (don't replace with actual line breaks)
- Include the BEGIN and END markers

## Security Best Practices

1. **Never commit `.env.local` to version control**
2. **Rotate service account keys periodically**
3. **Use proper Firestore security rules**
4. **Enable Firebase App Check** for production
5. **Monitor Firebase usage** to detect anomalies
6. **Use strong passwords** for admin accounts
7. **Enable 2FA** on Firebase Console access
8. **Regular security audits** of your Firebase configuration

## Maintenance

### Regular Updates

- Keep Next.js and dependencies updated
- Monitor for security vulnerabilities with `npm audit`
- Review and update Firebase security rules as needed

### Backup Strategy

- Enable Firestore daily backups in Firebase Console
- Export important data regularly
- Keep backups of your service account keys securely

### Monitoring

- Set up Firebase alerts for unusual activity
- Monitor Vercel deployment logs
- Track application errors and performance metrics

## Support

For issues specific to this deployment:
- Check the [project repository](https://github.com/Atlas-VSU/coral-ussc)
- Review Firebase documentation: https://firebase.google.com/docs
- Consult Next.js documentation: https://nextjs.org/docs

## Conclusion

Your CORAL-USSC instance is now deployed! Make sure to:
- Test all features thoroughly
- Configure proper security rules
- Set up monitoring and alerts
- Train administrators on using the system
- Document any custom configurations specific to USSC
