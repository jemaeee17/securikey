SECURIKEY - RFID SMART DOOR LOCK & REAL - TIME MONITORING SYSTEM

Securikey is a solo-built RFID smart door lock and security monitoring system developed using React Native, Firebase, ESP32, and a deployed backend server for real-time communication.
The system combines IoT hardware, mobile development, and cloud-based services to provide secure door access, authentication, real-time monitoring, notifications, and role-based access management.
Built entirely independently, this project demonstrates full-stack mobile, backend, and embedded systems development.

FEATURES
- RFID DOOR ACCESS CONTROL
  * RFID-based authentication system
  * ESP32-controlled smart door locking mechanism
  * Authorized faculty access validation
  * Secure entry verification
    
- REACT NATIVE MOBILE APPLICATION
  * User authentication and login
  * Role-based access (Admin & Faculty)
  * Security monitoring dashboard
  * Real-time access log tracking
  * Log history with timestamps
  * Live notifications for access events

- BACKEND AND REAL-TIME COMMUNICATION
  * Backend server deployed on Render
  * Real-time synchronization between hardware and and mobile application
  * Live event logging and data updates

- SECURITY FEATURES
  * Firebase Authentication
  * Protected user sessions
  * Secure role-based permissions
  * Controlled access monitoring

- TECH STACK
* Mobile Development
  - React Native
* Backend & Cloud Services
  - Firebase Authentication
  - Firebase Database/ Firestore
  - Render (Server deployment)
* Hardware / IOT
  - Arduino ESP32
  - RFID Module
  - Smart Door Lock Integration

- SYSTEM WORKFLOW
  * Users scans RFID Card
  * ESP32 process authentication request
  * Backend validates access credentials
  * Door access is granted or denied
  * Event data is stored and synchronized
  * Mobile app receives a real-time log updates
  * Notifications are sent to authorized users

- USER ROLES
* Admin
  - Monitor all access activity
  - View complete logs and timestamps
  - Receive security notifications
  - Access monitoring dashboard

* Faculty
  - Authenticate for authorize entry
  - View relevant access records
  - Receive access notifications

- INSTALLATION
  * git clone
