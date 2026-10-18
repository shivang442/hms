# PulseCare — Hospital Management System (HMS)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-teal.svg)](https://tailwindcss.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue.svg)](https://www.mysql.com/)
[![Redis](https://img.shields.io/badge/Redis-7-red.svg)](https://redis.io/)
[![Apache Kafka](https://img.shields.io/badge/Kafka-7.5-black.svg)](https://kafka.apache.org/)

**PulseCare** is a full-stack, enterprise-grade Hospital Management System engineered with Java 17, Spring Boot 3, React 18, Tailwind CSS, MySQL 8, Redis, and Apache Kafka. It features complete Role-Based Access Control (RBAC), concurrency-safe appointment booking, event-driven asynchronous notifications, Redis caching with graceful fallbacks, and comprehensive administrative audit logging.

---

## 1. Features by User Role

### 🛡️ Administrator Portal
- **Executive Hospital Dashboard**: Real-time metrics on total patients, active physicians, lifetime consultations, and today's bookings.
- **Visual Analytics**: Interactive Recharts visualizations displaying appointment status distributions and consultation volume across clinical departments.
- **Doctor Directory Management**: Add, edit credentials, search, filter by department, and activate/deactivate specialists with destructive action confirmation dialogs.
- **Patient Registry**: Access comprehensive demographic records, verified phone numbers, and emergency contacts.
- **Global Appointment Management**: Oversee hospital-wide consultations, modify statuses (`CONFIRMED`, `COMPLETED`, `CANCELLED`), and enforce scheduling rules.
- **Audit Logging**: Trace all system logins, profile updates, and booking actions with detailed timestamps.

### 🩺 Doctor / Physician Portal
- **Clinical Dashboard**: Overview of assigned patients, today's consultation schedule, and quick status action controls.
- **Daily Schedule View**: Detailed patient consultation queue sorted chronologically with patient contact details and clinical complaint notes.
- **Consultation Lifecycle**: Mark visits as `COMPLETED` or `CANCELLED` directly from the queue.
- **Availability & Slot Management**: Configure daily consultation hours and customize appointment slot durations (15m, 30m, 45m, 60m).
- **Physician Profile**: Maintain professional biography, degrees, and consultation fees.

### 🏥 Patient Portal
- **Patient Health Dashboard**: Overview of upcoming medical appointments, recent notifications, and digital patient health card.
- **Doctor Search & Discovery**: Filter certified physicians by medical specialization (Cardiology, Neurology, Pediatrics, Orthopedics, etc.), review bios, credentials, and consultation fees.
- **Live Appointment Booking**: Interactive calendar date selector with real-time calculated slot availability. Booked or conflicting slots are automatically locked and disabled.
- **Concurrency & Double-Booking Protection**: Transactional validation prevents overlapping bookings for both doctor and patient.
- **Appointment History & Timeline**: Review all past visits, clinical notes, and booking statuses.
- **Notification Center**: Real-time notifications for booking confirmations and schedule modifications generated asynchronously via Kafka.
- **Profile Management**: Update contact details, home address, and emergency contact numbers.

---

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4, React Router v7, Axios, Lucide React, Recharts |
| **Backend** | Java 17, Spring Boot 3.2.5, Spring Data JPA, Hibernate 6, Spring Security 6, JJWT 0.12.5, Bean Validation |
| **Database** | MySQL 8.0, Flyway Database Migrations |
| **Caching** | Redis 7 (Spring Cache with custom error handler and graceful fallback) |
| **Messaging** | Apache Kafka 7.5 & Zookeeper (Event-driven appointment notification pipeline) |
| **Containerization** | Docker & Docker Compose |
| **Testing** | JUnit 5, Mockito, AssertJ, Spring Boot Test, H2 In-Memory DB |

---

## 3. Seed Demo Credentials

The login screen includes **1-Click Demo Credentials** buttons to instantly autofill and sign in:

| Role | Email | Password | Pre-configured Data |
|---|---|---|---|
| **Admin** | `admin@hospital.com` | `Password123!` | System administrator with full oversight |
| **Doctor** | `doctor@hospital.com` | `Password123!` | Dr. Sarah Jenkins (Cardiologist, $150.00/visit) |
| **Doctor** | `robert.chen@hospital.com` | `Password123!` | Dr. Robert Chen (Neurologist, $180.00/visit) |
| **Doctor** | `priya.sharma@hospital.com` | `Password123!` | Dr. Priya Sharma (Pediatrician, $120.00/visit) |
| **Doctor** | `marcus.vance@hospital.com` | `Password123!` | Dr. Marcus Vance (Orthopedic Surgeon, $160.00/visit) |
| **Patient** | `patient@hospital.com` | `Password123!` | John Doe (Sample verified patient with bookings) |
| **Patient** | `emily.watson@hospital.com` | `Password123!` | Emily Watson (Sample patient) |

---

## 4. Quick Start: Local Run

### Option A: Local Standalone Execution (No Docker required)

The application includes an in-memory development profile (`local`) that automatically runs H2 database and in-memory caches and queues, allowing you to run the system immediately.

#### Step 1: Start Backend
```powershell
cd backend
mvn spring-boot:run
```
*The Spring Boot server will start on `http://localhost:8080` and auto-initialize synthetic seed data.*

#### Step 2: Start Frontend
```powershell
cd frontend
npm install
npm run dev
```
*The Vite React frontend will start on `http://localhost:3000` (or `http://localhost:5173`).*

---

### Option B: Full Infrastructure with Docker Compose

To launch all containers (MySQL 8, Redis 7, Kafka, Zookeeper, Backend, Frontend):

```bash
docker-compose up --build
```

Access Points:
- **Frontend SPA**: `http://localhost:3000`
- **Backend REST API**: `http://localhost:8080`
- **MySQL 8**: `localhost:3306` (User: `root`, Password: `rootpassword`, Database: `hms_db`)
- **Redis 7**: `localhost:6379`
- **Kafka Broker**: `localhost:9092`

---

## 5. Running Automated Tests

Run the full suite of unit, security, integration, and concurrency tests:

```powershell
cd backend
mvn test
```

### Verified Test Suite Results:
- **`AppointmentServiceTest`**: Concurrency validation, double-booking prevention (`AppointmentConflictException`), past booking rejection, out-of-bounds availability check, self-cancellation, unauthorized modification rejection.
- **`PatientServiceTest`**: Patient authorization, medical record isolation (`UnauthorizedException`).
- **`AuthServiceTest`**: JWT emission, duplicate email rejection, patient demographic creation.
- **`DoctorServiceTest`**: Profile caching, doctor onboarding with audit logging, roster deactivation.
- **`AppointmentEventConsumerTest`**: Idempotent message consumption and duplicate suppression.
- **`AuthControllerIntegrationTest`**: Full end-to-end `@SpringBootTest` testing login, registration, and form validation error responses.

---

## 6. Project Layout

```text
hospital-management-system/
├── frontend/                     # React 18 + Vite + Tailwind CSS Application
│   ├── src/
│   │   ├── components/           # Navbar, Sidebar, Layout, Modal, StatCard, StatusBadge
│   │   ├── context/              # AuthContext (JWT session state & auto-sync)
│   │   ├── pages/
│   │   │   ├── auth/             # Login (with 1-click demo logins), Register
│   │   │   ├── admin/            # AdminDashboard, DoctorManagement, PatientManagement, AuditLogs
│   │   │   ├── doctor/           # DoctorDashboard, DoctorAvailabilityPage
│   │   │   ├── patient/          # PatientDashboard
│   │   │   ├── doctors/          # DoctorListPage (Search, Department filters, Bio)
│   │   │   ├── appointments/     # BookAppointmentPage, AppointmentManagement, History
│   │   │   ├── profile/          # UserProfilePage
│   │   │   ├── notifications/    # NotificationsPage
│   │   │   └── error/            # Forbidden (403), NotFound (404)
│   │   ├── services/             # Axios API client modules
│   │   └── App.jsx               # Role-based protected routes
│   └── package.json
├── backend/                      # Spring Boot 3.2.5 Enterprise Application
│   ├── src/main/java/com/hospital/hms/
│   │   ├── audit/                # Asynchronous audit log persistence
│   │   ├── config/               # SecurityConfig, RedisCacheConfig, KafkaConfig, DataInitializer
│   │   ├── controller/           # REST Controllers (/api/auth, /api/doctors, /api/appointments, etc.)
│   │   ├── dto/                  # Data Transfer Objects strictly isolated from entities
│   │   ├── entity/               # JPA Entities (User, Patient, Doctor, Availability, Appointment, etc.)
│   │   ├── event/                # Kafka event publisher and idempotent consumer
│   │   ├── exception/            # Centralized RFC 7807 GlobalExceptionHandler
│   │   ├── mapper/               # Entity to DTO mapping
│   │   ├── repository/           # Spring Data repositories with conflict detection queries
│   │   ├── security/             # Stateless JWT filter, UserPrincipal, UserDetailsService
│   │   └── service/              # Transactional business logic & scheduling slot calculators
│   ├── src/main/resources/
│   │   ├── db/migration/         # Flyway relational schema migration scripts
│   │   ├── application.yml       # Production MySQL, Redis, Kafka configuration
│   │   └── application-test.yml  # Isolated in-memory H2 test configuration
│   └── pom.xml                   # Maven dependencies
├── docs/                         # In-depth architectural & API specifications
│   ├── architecture.md           # System architecture, RBAC, Concurrency, Kafka, Redis
│   ├── database-schema.md        # Relational ER diagram, tables, indexes, constraints
│   ├── api-documentation.md      # REST API request/response specifications
│   └── testing.md                # Testing strategy and execution report
├── docker-compose.yml            # Multi-service infrastructure orchestration
├── .env.example                  # Environment configuration template
└── README.md                     # Project documentation & runbook
```
