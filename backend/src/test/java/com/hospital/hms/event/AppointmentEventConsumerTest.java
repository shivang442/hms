package com.hospital.hms.event;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.NotificationRepository;
import com.hospital.hms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentEventConsumerTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AppointmentEventConsumer eventConsumer;

    private User patientUser;
    private Patient patient;
    private User doctorUser;
    private Doctor doctor;
    private Appointment appointment;
    private AppointmentBookedEvent event;

    @BeforeEach
    void setUp() {
        patientUser = new User("John Doe", "patient@test.com", "hash", Role.PATIENT);
        patientUser.setId(10L);
        patient = new Patient(patientUser, LocalDate.now(), "phone", "addr", "em");
        patient.setId(100L);

        doctorUser = new User("Dr. Sarah", "doctor@test.com", "hash", Role.DOCTOR);
        doctorUser.setId(20L);
        doctor = new Doctor(doctorUser, "Cardiology", "MD", 10, BigDecimal.TEN, "Bio");
        doctor.setId(200L);

        LocalDateTime now = LocalDateTime.now();
        appointment = new Appointment(patient, doctor, now.plusDays(1), now.plusDays(1).plusMinutes(30), AppointmentStatus.CONFIRMED, "Reason");
        appointment.setId(500L);

        event = new AppointmentBookedEvent("evt-123", 500L, 100L, 10L, 200L, 20L, appointment.getStartTime(), appointment.getEndTime());
    }

    @Test
    @DisplayName("Creates notifications for patient and doctor on first event receipt")
    void processAppointmentBooked_FirstTime_CreatesNotifications() {
        when(appointmentRepository.findById(500L)).thenReturn(Optional.of(appointment));
        when(notificationRepository.existsByUserIdAndAppointmentIdAndNotificationType(eq(10L), eq(500L), eq(NotificationType.APPOINTMENT_BOOKED))).thenReturn(false);
        when(userRepository.findById(10L)).thenReturn(Optional.of(patientUser));

        when(notificationRepository.existsByUserIdAndAppointmentIdAndNotificationType(eq(20L), eq(500L), eq(NotificationType.APPOINTMENT_BOOKED))).thenReturn(false);
        when(userRepository.findById(20L)).thenReturn(Optional.of(doctorUser));

        eventConsumer.processAppointmentBooked(event);

        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    @DisplayName("Idempotent check prevents duplicate notifications when duplicate event is processed")
    void processAppointmentBooked_DuplicateEvent_IsIdempotent() {
        when(appointmentRepository.findById(500L)).thenReturn(Optional.of(appointment));
        // Already notified!
        when(notificationRepository.existsByUserIdAndAppointmentIdAndNotificationType(eq(10L), eq(500L), eq(NotificationType.APPOINTMENT_BOOKED))).thenReturn(true);
        when(notificationRepository.existsByUserIdAndAppointmentIdAndNotificationType(eq(20L), eq(500L), eq(NotificationType.APPOINTMENT_BOOKED))).thenReturn(true);

        eventConsumer.processAppointmentBooked(event);

        // Should NOT save any new notification
        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
