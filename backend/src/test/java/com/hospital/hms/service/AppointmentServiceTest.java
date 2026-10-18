package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.appointment.AppointmentDTO;
import com.hospital.hms.dto.appointment.BookAppointmentRequest;
import com.hospital.hms.dto.appointment.UpdateAppointmentStatusRequest;
import com.hospital.hms.entity.*;
import com.hospital.hms.event.AppointmentEventPublisher;
import com.hospital.hms.exception.AppointmentConflictException;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorAvailabilityRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorAvailabilityRepository availabilityRepository;

    @Mock
    private AppointmentEventPublisher eventPublisher;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AppointmentService appointmentService;

    private User patientUser;
    private Patient patient;
    private User doctorUser;
    private Doctor doctor;
    private DoctorAvailability availability;
    private UserPrincipal patientPrincipal;

    @BeforeEach
    void setUp() {
        patientUser = new User("John Doe", "patient@hospital.com", "hash", Role.PATIENT);
        patientUser.setId(10L);
        patient = new Patient(patientUser, LocalDate.of(1990, 1, 1), "1234567890", "Address", "Contact");
        patient.setId(100L);

        doctorUser = new User("Dr. Sarah Jenkins", "doctor@hospital.com", "hash", Role.DOCTOR);
        doctorUser.setId(20L);
        doctor = new Doctor(doctorUser, "Cardiology", "MD", 10, new BigDecimal("150.00"), "Bio");
        doctor.setId(200L);

        availability = new DoctorAvailability(doctor, LocalDate.now().plusDays(2), LocalTime.of(9, 0), LocalTime.of(17, 0), 30);
        availability.setId(1L);

        patientPrincipal = new UserPrincipal(patientUser.getId(), patientUser.getFullName(),
                patientUser.getEmail(), patientUser.getPasswordHash(), Role.PATIENT, true,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PATIENT")));
    }

    @Test
    @DisplayName("Successfully book appointment when slot is open and inside availability")
    void bookAppointment_Success() {
        LocalDateTime start = LocalDate.now().plusDays(2).atTime(10, 0);
        LocalDateTime end = start.plusMinutes(30);

        BookAppointmentRequest request = new BookAppointmentRequest(null, 200L, start, end, "Routine checkup");

        when(patientRepository.findByUserId(10L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(doctor));
        when(availabilityRepository.findByDoctorIdAndAvailableDate(200L, start.toLocalDate())).thenReturn(Optional.of(availability));
        when(appointmentRepository.countDoctorOverlappingAppointments(eq(200L), any(), any(), any())).thenReturn(0L);
        when(appointmentRepository.countPatientOverlappingAppointments(eq(100L), any(), any(), any())).thenReturn(0L);

        Appointment savedAppointment = new Appointment(patient, doctor, start, end, AppointmentStatus.CONFIRMED, "Routine checkup");
        savedAppointment.setId(500L);
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(savedAppointment);

        AppointmentDTO result = appointmentService.bookAppointment(request, patientPrincipal);

        assertNotNull(result);
        assertEquals(500L, result.getId());
        assertEquals(AppointmentStatus.CONFIRMED, result.getStatus());
        verify(eventPublisher, times(1)).publishAppointmentBooked(eq(500L), eq(100L), eq(10L), eq(200L), eq(20L), eq(start), eq(end));
    }

    @Test
    @DisplayName("Double booking attempt throws AppointmentConflictException")
    void bookAppointment_ThrowsConflict_WhenDoctorHasOverlap() {
        LocalDateTime start = LocalDate.now().plusDays(2).atTime(10, 0);
        LocalDateTime end = start.plusMinutes(30);

        BookAppointmentRequest request = new BookAppointmentRequest(null, 200L, start, end, "Routine checkup");

        when(patientRepository.findByUserId(10L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(doctor));
        when(availabilityRepository.findByDoctorIdAndAvailableDate(200L, start.toLocalDate())).thenReturn(Optional.of(availability));
        // Overlap exists
        when(appointmentRepository.countDoctorOverlappingAppointments(eq(200L), any(), any(), any())).thenReturn(1L);

        assertThrows(AppointmentConflictException.class, () -> appointmentService.bookAppointment(request, patientPrincipal));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Booking in the past throws BadRequestException")
    void bookAppointment_ThrowsBadRequest_WhenInThePast() {
        LocalDateTime pastStart = LocalDateTime.now().minusDays(1);
        LocalDateTime pastEnd = pastStart.plusMinutes(30);

        BookAppointmentRequest request = new BookAppointmentRequest(null, 200L, pastStart, pastEnd, "Past appointment");

        assertThrows(BadRequestException.class, () -> appointmentService.bookAppointment(request, patientPrincipal));
    }

    @Test
    @DisplayName("Booking outside doctor availability window throws BadRequestException")
    void bookAppointment_ThrowsBadRequest_WhenOutsideAvailabilityHours() {
        LocalDateTime start = LocalDate.now().plusDays(2).atTime(7, 0); // Doctor starts at 9:00 AM
        LocalDateTime end = start.plusMinutes(30);

        BookAppointmentRequest request = new BookAppointmentRequest(null, 200L, start, end, "Early booking");

        when(patientRepository.findByUserId(10L)).thenReturn(Optional.of(patient));
        when(doctorRepository.findById(200L)).thenReturn(Optional.of(doctor));
        when(availabilityRepository.findByDoctorIdAndAvailableDate(200L, start.toLocalDate())).thenReturn(Optional.of(availability));

        assertThrows(BadRequestException.class, () -> appointmentService.bookAppointment(request, patientPrincipal));
    }

    @Test
    @DisplayName("Patient can cancel their own appointment")
    void updateStatus_PatientCancel_Success() {
        LocalDateTime start = LocalDate.now().plusDays(2).atTime(10, 0);
        LocalDateTime end = start.plusMinutes(30);
        Appointment appointment = new Appointment(patient, doctor, start, end, AppointmentStatus.CONFIRMED, "Initial");
        appointment.setId(500L);

        when(appointmentRepository.findById(500L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any(Appointment.class))).thenReturn(appointment);

        UpdateAppointmentStatusRequest request = new UpdateAppointmentStatusRequest(AppointmentStatus.CANCELLED, "Schedule clash");
        AppointmentDTO result = appointmentService.updateStatus(500L, request, patientPrincipal);

        assertEquals(AppointmentStatus.CANCELLED, result.getStatus());
    }

    @Test
    @DisplayName("Patient cannot modify another patient's appointment")
    void updateStatus_UnauthorizedForOtherPatient() {
        User otherUser = new User("Other User", "other@hospital.com", "hash", Role.PATIENT);
        otherUser.setId(99L);
        Patient otherPatient = new Patient(otherUser, LocalDate.of(1995, 1, 1), "0000000000", "Addr", "Contact");
        otherPatient.setId(999L);

        LocalDateTime start = LocalDate.now().plusDays(2).atTime(10, 0);
        LocalDateTime end = start.plusMinutes(30);
        Appointment appointment = new Appointment(otherPatient, doctor, start, end, AppointmentStatus.CONFIRMED, "Other appt");
        appointment.setId(600L);

        when(appointmentRepository.findById(600L)).thenReturn(Optional.of(appointment));

        UpdateAppointmentStatusRequest request = new UpdateAppointmentStatusRequest(AppointmentStatus.CANCELLED, "Cancel");

        assertThrows(UnauthorizedException.class, () -> appointmentService.updateStatus(600L, request, patientPrincipal));
    }
}
