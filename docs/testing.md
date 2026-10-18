# Hospital Management System (HMS) — Testing Strategy & Report

## 1. Testing Philosophy

The automated test suite uses isolated test data and avoids dependencies on external production databases or message brokers. All critical business rules, security boundaries, concurrency guarantees, and event consumers are verified.

---

## 2. Test Architecture

- **Framework**: JUnit 5, Mockito, Spring Boot Test (`@SpringBootTest`, `@AutoConfigureMockMvc`).
- **Database**: H2 In-Memory Database running in MySQL compatibility mode (`application-test.yml`).
- **Isolation**: Each test runs with freshly created fixtures or transaction rollbacks.
- **Mocking**: External brokers (Kafka template) and Redis connections are mocked or isolated using Spring Boot test profiles.

---

## 3. Test Coverage Matrix

| Test Class | Focus Area | Scenarios Verified |
|---|---|---|
| `AppointmentServiceTest` | Concurrency & Validation | • Normal slot booking success<br>• Double booking rejection (`AppointmentConflictException`)<br>• Past time booking rejection (`BadRequestException`)<br>• Out-of-bounds availability booking rejection<br>• Patient self-cancellation success<br>• Unauthorized appointment modification by third party |
| `PatientServiceTest` | Record Access Security | • Authorized patient reading their own record<br>• Unauthorized patient reading another patient's medical history (`UnauthorizedException`) |
| `AuthServiceTest` | Identity & Registration | • Successful login with token generation<br>• Duplicate email rejection on registration<br>• Patient profile creation during registration |
| `DoctorServiceTest` | Doctor Management & Cache | • Profile lookup by ID<br>• ResourceNotFoundException on unknown ID<br>• Doctor onboarding with audit trail logging<br>• Active status deactivation<br>• Distinct specialization aggregation |
| `AppointmentEventConsumerTest` | Kafka Idempotency | • First-time event processing creates patient and doctor notifications<br>• Duplicate event processing is idempotent and prevents duplicate notification records |
| `AuthControllerIntegrationTest` | End-to-End API Security | • `POST /api/auth/login` valid credentials (200 OK)<br>• `POST /api/auth/login` bad credentials (401 Unauthorized)<br>• Invalid form inputs validation error handling (400 Bad Request with field errors)<br>• `POST /api/auth/register` creates new patient user in H2 database (201 Created) |

---

## 4. Test Execution Command

To run the complete automated test suite locally:

```powershell
cd backend
mvn test
```

### Verified Test Run Results:
```text
[INFO] Results:
[INFO] 
[INFO] Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
[INFO] Total time: 16.290 s
```
All 22 unit, security, integration, and concurrency tests passed with 0 failures and 0 errors.
