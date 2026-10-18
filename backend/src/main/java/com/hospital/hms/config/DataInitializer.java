package com.hospital.hms.config;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentRepository appointmentRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public DataInitializer(UserRepository userRepository,
                           DoctorRepository doctorRepository,
                           PatientRepository patientRepository,
                           DoctorAvailabilityRepository availabilityRepository,
                           AppointmentRepository appointmentRepository,
                           NotificationRepository notificationRepository,
                           AuditLogRepository auditLogRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.availabilityRepository = availabilityRepository;
        this.appointmentRepository = appointmentRepository;
        this.notificationRepository = notificationRepository;
        this.auditLogRepository = auditLogRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            logger.info("Database already initialized. Skipping seed data.");
            return;
        }

        logger.info("Initializing synthetic seed data for Hospital Management System...");

        String defaultPasswordHash = passwordEncoder.encode("Password123!");

        // 1. Create Admin
        User adminUser = new User("System Administrator", "admin@hospital.com", defaultPasswordHash, Role.ADMIN);
        adminUser = userRepository.save(adminUser);
        auditLogRepository.save(new AuditLog(adminUser.getId(), "SYSTEM_INIT", "User", adminUser.getId(), "Created root administrator"));

        // 2. Create Doctors
        // Doctor 1: Cardiology
        User doc1User = new User("Dr. Sarah Jenkins", "doctor@hospital.com", defaultPasswordHash, Role.DOCTOR);
        doc1User = userRepository.save(doc1User);
        Doctor doc1 = new Doctor(doc1User, "Cardiology", "MD, FACC - Harvard Medical School", 14,
                new BigDecimal("150.00"), "Specialist in cardiovascular care, preventative cardiology, and echocardiography.");
        doc1 = doctorRepository.save(doc1);

        // Doctor 2: Neurology
        User doc2User = new User("Dr. Robert Chen", "robert.chen@hospital.com", defaultPasswordHash, Role.DOCTOR);
        doc2User = userRepository.save(doc2User);
        Doctor doc2 = new Doctor(doc2User, "Neurology", "MD, PhD - Johns Hopkins University", 16,
                new BigDecimal("180.00"), "Expert in neurological disorders, stroke prevention, and advanced migraine management.");
        doc2 = doctorRepository.save(doc2);

        // Doctor 3: Pediatrics
        User doc3User = new User("Dr. Priya Sharma", "priya.sharma@hospital.com", defaultPasswordHash, Role.DOCTOR);
        doc3User = userRepository.save(doc3User);
        Doctor doc3 = new Doctor(doc3User, "Pediatrics", "MBBS, MD Pediatrics - Stanford Medicine", 10,
                new BigDecimal("120.00"), "Compassionate pediatric care from infancy through adolescence with focus on child wellness.");
        doc3 = doctorRepository.save(doc3);

        // Doctor 4: Orthopedics
        User doc4User = new User("Dr. Marcus Vance", "marcus.vance@hospital.com", defaultPasswordHash, Role.DOCTOR);
        doc4User = userRepository.save(doc4User);
        Doctor doc4 = new Doctor(doc4User, "Orthopedics", "MS Orthopedics - Mayo Clinic", 12,
                new BigDecimal("160.00"), "Specializes in sports medicine, joint replacements, and arthroscopic reconstructions.");
        doc4 = doctorRepository.save(doc4);

        // 3. Seed Doctor Availabilities for next 14 days
        LocalDate today = LocalDate.now();
        Doctor[] doctors = {doc1, doc2, doc3, doc4};

        for (Doctor doc : doctors) {
            for (int i = 0; i < 14; i++) {
                LocalDate date = today.plusDays(i);
                // Skip Sundays
                if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
                    continue;
                }
                DoctorAvailability availability = new DoctorAvailability(
                        doc,
                        date,
                        LocalTime.of(9, 0),
                        LocalTime.of(17, 0),
                        30
                );
                availabilityRepository.save(availability);
            }
        }

        // 4. Create Patients
        User pat1User = new User("John Doe", "patient@hospital.com", defaultPasswordHash, Role.PATIENT);
        pat1User = userRepository.save(pat1User);
        Patient pat1 = new Patient(
                pat1User,
                LocalDate.of(1988, 5, 14),
                "+1 (555) 234-5678",
                "742 Evergreen Terrace, Springfield",
                "Jane Doe - +1 (555) 987-6543"
        );
        pat1 = patientRepository.save(pat1);

        User pat2User = new User("Emily Watson", "emily.watson@hospital.com", defaultPasswordHash, Role.PATIENT);
        pat2User = userRepository.save(pat2User);
        Patient pat2 = new Patient(
                pat2User,
                LocalDate.of(1994, 9, 22),
                "+1 (555) 345-6789",
                "123 Oak Avenue, Metropolis",
                "David Watson - +1 (555) 876-5432"
        );
        pat2 = patientRepository.save(pat2);

        // 5. Create Sample Appointments
        // Confirmed Appointment for tomorrow
        LocalDateTime tomorrowSlotStart = today.plusDays(1).atTime(10, 0);
        LocalDateTime tomorrowSlotEnd = tomorrowSlotStart.plusMinutes(30);
        Appointment appt1 = new Appointment(
                pat1, doc1, tomorrowSlotStart, tomorrowSlotEnd,
                AppointmentStatus.CONFIRMED, "Routine cardiovascular evaluation and blood pressure check."
        );
        appt1 = appointmentRepository.save(appt1);

        // Completed Appointment yesterday
        LocalDateTime yesterdaySlotStart = today.minusDays(1).atTime(14, 0);
        LocalDateTime yesterdaySlotEnd = yesterdaySlotStart.plusMinutes(30);
        Appointment appt2 = new Appointment(
                pat1, doc3, yesterdaySlotStart, yesterdaySlotEnd,
                AppointmentStatus.COMPLETED, "Annual wellness checkup and allergy consultation."
        );
        appointmentRepository.save(appt2);

        // Future Appointment for Patient 2
        LocalDateTime futureSlotStart = today.plusDays(2).atTime(11, 30);
        LocalDateTime futureSlotEnd = futureSlotStart.plusMinutes(30);
        Appointment appt3 = new Appointment(
                pat2, doc2, futureSlotStart, futureSlotEnd,
                AppointmentStatus.CONFIRMED, "Chronic tension headache assessment and follow-up."
        );
        appointmentRepository.save(appt3);

        // 6. Create Sample Notifications
        Notification notif1 = new Notification(
                pat1User,
                appt1,
                NotificationType.APPOINTMENT_BOOKED,
                "Your appointment with Dr. Sarah Jenkins is booked for tomorrow at 10:00 AM."
        );
        notificationRepository.save(notif1);

        Notification notif2 = new Notification(
                doc1User,
                appt1,
                NotificationType.APPOINTMENT_BOOKED,
                "New appointment scheduled with patient John Doe for tomorrow at 10:00 AM."
        );
        notificationRepository.save(notif2);

        // 7. Audit log initial record
        auditLogRepository.save(new AuditLog(adminUser.getId(), "SEED_DATA", "HospitalSystem", null, "Populated synthetic doctors, availability and demo patients"));

        logger.info("Synthetic seed data initialization completed successfully.");
    }
}
