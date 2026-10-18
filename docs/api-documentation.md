# Hospital Management System (HMS) — REST API Documentation

All API endpoints return a standardized JSON envelope:
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... }
}
```

Error responses follow RFC 7807 structured format:
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "One or more input fields are invalid",
  "timestamp": "2026-10-18T16:00:00",
  "validationErrors": {
    "email": "Email must be valid"
  }
}
```

---

## 1. Authentication APIs (`/api/auth`)

### 1.1 `POST /api/auth/login`
Authenticates user and returns JWT token.

- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@hospital.com",
    "password": "Password123!"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "id": 1,
      "roleEntityId": null,
      "email": "admin@hospital.com",
      "fullName": "System Administrator",
      "role": "ADMIN"
    }
  }
  ```

### 1.2 `POST /api/auth/register`
Registers a new patient account with demographic profile.

- **Access**: Public
- **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "PATIENT",
    "dateOfBirth": "1994-08-15",
    "phone": "+1 (555) 345-6789",
    "address": "456 Oak Avenue",
    "emergencyContact": "John Doe - 555-987-6543"
  }
  ```
- **Response** (201 Created): Returns token and patient profile details.

### 1.3 `GET /api/auth/me`
Retrieves current authenticated user's session context.

- **Access**: Authenticated

---

## 2. Doctor APIs (`/api/doctors`)

### 2.1 `GET /api/doctors`
Search and filter doctors with pagination.

- **Access**: Public
- **Query Parameters**:
  - `query` (optional): Doctor name or keywords
  - `specialization` (optional): Filter by department
  - `activeOnly` (optional, default `true`): Filter active doctors
  - `page` (default `0`), `size` (default `10`)

### 2.2 `GET /api/doctors/{id}`
Retrieves full doctor profile. Cached in Redis under `doctorProfiles::{id}`.

- **Access**: Public

### 2.3 `GET /api/doctors/specializations`
Returns distinct active medical specializations. Cached in Redis.

- **Access**: Public

### 2.4 `POST /api/doctors`
Onboards a new doctor into the hospital system. Evicts Redis cache.

- **Access**: `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "fullName": "Dr. Gregory House",
    "email": "house@hospital.com",
    "password": "Password123!",
    "specialization": "Diagnostic Medicine",
    "qualification": "MD - Johns Hopkins",
    "experienceYears": 20,
    "consultationFee": 250.00,
    "biography": "Board-certified diagnostic specialist."
  }
  ```

### 2.5 `PUT /api/doctors/{id}`
Updates doctor credentials or consultation fee. Evicts Redis cache.

- **Access**: `ROLE_ADMIN` or assigning `ROLE_DOCTOR`

### 2.6 `PATCH /api/doctors/{id}/deactivate` & `/activate`
Toggles active roster status. Evicts Redis cache.

- **Access**: `ROLE_ADMIN`

---

## 3. Patient APIs (`/api/patients`)

### 3.1 `GET /api/patients`
Search patient records with pagination.

- **Access**: `ROLE_ADMIN`
- **Query Parameters**: `query`, `page`, `size`

### 3.2 `GET /api/patients/{id}`
Retrieves patient profile. Enforces patient ownership isolation.

- **Access**: `ROLE_ADMIN`, `ROLE_DOCTOR`, or the owning `ROLE_PATIENT`

### 3.3 `GET /api/patients/profile/me`
Retrieves logged-in patient's own profile.

- **Access**: `ROLE_PATIENT`

### 3.4 `PUT /api/patients/{id}`
Updates patient demographic, phone, address and emergency contact details.

- **Access**: Owning `ROLE_PATIENT` or `ROLE_ADMIN`

---

## 4. Availability APIs (`/api/availability`)

### 4.1 `POST /api/availability`
Sets or updates daily consultation window for a doctor.

- **Access**: `ROLE_DOCTOR` or `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "doctorId": 1,
    "availableDate": "2026-10-25",
    "startTime": "09:00:00",
    "endTime": "17:00:00",
    "slotDurationMinutes": 30
  }
  ```

### 4.2 `GET /api/availability/doctor/{doctorId}`
Retrieves upcoming consultation shifts for a doctor.

- **Access**: Public

### 4.3 `GET /api/availability/doctor/{doctorId}/slots?date=YYYY-MM-DD`
Computes individual time slots for a given date, cross-referencing existing non-cancelled bookings to mark slots as `available: true` or `available: false`.

- **Access**: Public
- **Response** (200 OK):
  ```json
  {
    "success": true,
    "data": [
      {
        "startTime": "2026-10-25T09:00:00",
        "endTime": "2026-10-25T09:30:00",
        "available": true
      },
      {
        "startTime": "2026-10-25T09:30:00",
        "endTime": "2026-10-25T10:00:00",
        "available": false
      }
    ]
  }
  ```

---

## 5. Appointment APIs (`/api/appointments`)

### 5.1 `POST /api/appointments`
Submits a consultation booking with atomic concurrency validation. Dispatches asynchronous Kafka event.

- **Access**: `ROLE_PATIENT` or `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "doctorId": 1,
    "startTime": "2026-10-25T10:00:00",
    "endTime": "2026-10-25T10:30:00",
    "reason": "Routine cardiovascular assessment"
  }
  ```
- **Responses**:
  - `201 Created`: Booking successful
  - `409 Conflict`: Slot already booked by another user (Double-booking rejected)
  - `400 Bad Request`: Time slot in past or outside doctor availability

### 5.2 `GET /api/appointments`
Retrieves appointment list, scoped automatically by authenticated role:
- Patients receive only their own bookings
- Doctors receive only appointments assigned to them
- Admins can query across all hospital appointments
- Supports `status`, `doctorId`, `patientId`, `startDate`, `endDate`, `page`, `size`

### 5.3 `PATCH /api/appointments/{id}/status`
Transitions appointment status. Enforces transition rules:
- Patients can only `CANCEL`
- Doctors can set `CONFIRMED`, `COMPLETED` or `CANCELLED`
- Admins can transition to any valid status

---

## 6. Notification APIs (`/api/notifications`)

### 6.1 `GET /api/notifications`
Paginated notifications for the current authenticated user.

### 6.2 `GET /api/notifications/recent`
Returns top 10 most recent notifications for navbar dropdown.

### 6.3 `GET /api/notifications/unread-count`
Returns count of unread notifications for badge rendering.

### 6.4 `PATCH /api/notifications/{id}/read` & `PATCH /api/notifications/read-all`
Acknowledges notifications.

---

## 7. Admin APIs (`/api/admin`)

### 7.1 `GET /api/admin/dashboard`
Returns aggregated hospital metrics:
- Total patients, active doctors, total appointments, today's bookings
- Appointment status breakdown counts
- Appointment volume by medical department (specialization)

### 7.2 `GET /api/admin/audit-logs`
Paginated audit trail of all administrative and security actions.

### 7.3 `GET /api/admin/users` & `PATCH /api/admin/users/{userId}/toggle-status`
User account management and status suspension/reactivation.
