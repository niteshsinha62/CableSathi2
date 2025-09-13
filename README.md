# Star Vision Cable & Broadband Tracker - React PWA

A modern Progressive Web Application (PWA) for managing cable and broadband service operations, built with React and Firebase.

## 🚀 Features

### Staff Features
- **Job Recording**: Record installation, maintenance, and repair jobs
- **Location Tracking**: GPS-based location capture with Google Maps integration
- **Photo Upload**: Camera capture and file upload with Cloudinary storage
- **Multi-language Support**: English and Hindi language options
- **Offline Capability**: PWA functionality for offline access

### Admin Features
- **Dashboard**: Comprehensive job overview with filtering and search
- **Map View**: Visual representation of all job locations on Google Maps
- **Analytics**: Performance metrics and area-wise statistics
- **Staff Management**: Add, edit, and track staff performance
- **Customer Management**: Add and manage customer information
- **Export Functionality**: Export data to Excel and PDF formats

### Technical Features
- **Progressive Web App**: Installable on mobile and desktop
- **Responsive Design**: Mobile-first design with touch-friendly interface
- **Real-time Updates**: Firebase Firestore for live data synchronization
- **Secure Authentication**: Firebase Authentication with role-based access
- **Cloud Storage**: Cloudinary integration for image management

## 🛠️ Technology Stack

- **Frontend**: React 18, TailwindCSS, Font Awesome
- **Backend**: Firebase (Firestore, Authentication)
- **Maps**: Google Maps JavaScript API
- **Storage**: Cloudinary for image uploads
- **PWA**: Service Worker, Web App Manifest
- **Build Tool**: Create React App

## 📱 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Firestore and Authentication enabled
- Google Maps API key
- Cloudinary account

### Local Development
The application is divided into two main roles with distinct functionalities:

### Staff Functionalities

* **Secure Login:** Staff log in with their credentials.
* **Job Data Entry:** Submit new job logs with details such as job type, service area, landmark, and notes.
* **Location Tagging:** Pinpoint job locations using an interactive map or the device's GPS.
* **Image Upload:** Attach multiple photos to a job log by either uploading from the device or using the camera.
* **Language Selection:** Switch the interface between English and Hindi.

### Admin Functionalities

* **Secure Login:** The admin has a unique user ID for access.
* **Real-time Dashboard:** View all submitted job logs as they come in.
* **Data Visualization:**
    * **Table View:** See all jobs in a sortable and filterable table.
    * **Map View:** See all jobs plotted as pins on an interactive map.
* **Data Analysis:** An analytics page provides a summary of job types completed in each service area.
* **Reporting:** Export filtered data into two formats:
    * **Excel:** A spreadsheet with all job details, including links to images and maps.
    * **PDF:** A detailed, multi-page report with one page per job, featuring larger, embedded images and clickable map links.
* **Data Management:** Securely delete job records from the database.
