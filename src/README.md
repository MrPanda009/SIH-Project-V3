# Civic Issue Reporting Platform

A comprehensive civic issue reporting platform built with React, Tailwind CSS, and Supabase, designed to connect citizens with government authorities for efficient issue resolution.

## Features

### 🏛️ **For Citizens**
- **Aadhaar-based Authentication** with OTP verification
- **Issue Reporting** with photo/video capture and GPS location
- **Real-time Status Tracking** with timeline updates
- **Community Features** including nearby issues and upvoting
- **Mobile-first Design** optimized for smartphones

### 🛡️ **For Authorities** 
- **Administrative Dashboard** with comprehensive analytics
- **Ticket Management** with status updates and resolution tracking
- **File Upload** for proof of resolution
- **KPI Metrics** showing total, pending, and completed issues
- **Ward-based Filtering** and location-based prioritization

### 🔧 **Technical Features**
- **Secure Backend** with Supabase authentication and storage
- **Real-time Updates** using Supabase subscriptions
- **File Storage** for images and documents
- **Location Services** with GPS coordinates and address resolution
- **Responsive Design** for desktop and mobile devices

## Getting Started

### Demo Accounts

You can test the platform with these demo credentials:

#### For Citizens:
- **Email:** citizen@demo.com
- **Password:** demo123
- **Aadhaar:** 123456789012 (demo only)

#### For Government Authorities:
- **Email:** authority@demo.com  
- **Password:** demo123
- **Aadhaar:** 987654321098 (demo only)

### Creating New Accounts

1. Click "Sign up" on the login screen
2. Fill in your details (use demo Aadhaar numbers for testing)
3. Choose between "Citizen" or "Government Authority" account type
4. Complete the registration process

**⚠️ Important:** This is a demo application. Never enter real Aadhaar numbers or sensitive personal information.

## How to Use

### As a Citizen:

1. **Report Issues**
   - Click "Raise a New Issue" 
   - Take a photo or upload an image
   - Select issue category (Garbage, Pothole, Streetlight, etc.)
   - Add optional description
   - Submit with auto-detected location

2. **Track Your Reports**
   - View all your submitted tickets
   - Monitor status changes in real-time
   - See resolution updates from authorities

3. **Community Participation**
   - Browse nearby issues reported by others
   - Upvote issues to show community support
   - View issues on an interactive map

### As an Authority:

1. **Dashboard Overview**
   - View key performance indicators
   - Monitor recent issues and trends
   - Track resolution statistics

2. **Manage Issues**
   - Filter issues by status and location
   - Update ticket status (Submitted → In Progress → Completed)
   - Add resolution notes and proof images
   - Close resolved issues

3. **Analytics**
   - Review performance metrics
   - Analyze issue patterns by category and location
   - Generate reports for management

## Issue Categories

The platform supports various civic issue types:
- 🗑️ **Garbage Management** - Waste collection and disposal issues
- 🕳️ **Pothole** - Road damage and maintenance  
- 💡 **Streetlight** - Public lighting problems
- 💧 **Water Supply** - Water availability and quality issues
- 🌊 **Drainage** - Sewage and storm water problems
- 🚦 **Traffic** - Traffic management and safety concerns
- 🔊 **Noise Pollution** - Excessive noise complaints
- 🔧 **Other** - Miscellaneous civic issues

## Status Workflow

Issues follow a clear status progression:
1. **Submitted** - Initial report filed by citizen
2. **In Progress** - Authority has acknowledged and started work
3. **Completed** - Issue has been resolved with proof
4. **Closed** - Final status after citizen confirmation

## Privacy & Security

- All user data is encrypted and stored securely
- Location data is only used for issue reporting and routing
- File uploads are scanned and stored in secure cloud storage
- Personal information is protected according to data privacy regulations

## Technology Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Authentication:** Supabase Auth with email/password
- **File Storage:** Supabase Storage with signed URLs
- **Real-time:** Supabase Subscriptions
- **Deployment:** Vercel/Netlify compatible

---

**Note:** This is a prototype application designed for demonstration purposes. In a production environment, additional security measures, data validation, and integration with government systems would be required.