package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.appointment.AppointmentDTO;
import com.hospital.hms.dto.appointment.BookAppointmentRequest;
import com.hospital.hms.dto.appointment.UpdateAppointmentStatusRequest;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.entity.*;
import com.hospital.hms.event.AppointmentEventPublisher;
import com.hospital.hms.exception.AppointmentConflictException;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.mapper.EntityMapper;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorAvailabilityRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AppointmentService {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentService.class);

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DoctorAvailabilityRepository availabilityRepository;
    private final AppointmentEventPublisher eventPublisher;
    private final AuditService auditService;

    @Autowired
    public AppointmentService(AppointmentRepository appointmentRepository,
                              DoctorRepository doctorRepository,
                              PatientRepository patientRepository,
                              DoctorAvailabilityRepository availabilityRepository,
                              AppointmentEventPublisher eventPublisher,
                              AuditService auditService) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.availabilityRepository = availabilityRepository;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public AppointmentDTO bookAppointment(BookAppointmentRequest request, UserPrincipal currentUser) {
        // 1. Time validity checks
        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("Appointment end time must be strictly after start time");
        }

        if (request.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book an appointment in the past");
        }

        // 2. Resolve Patient
        Patient patient;
        if (currentUser.getRole() == Role.PATIENT) {
            patient = patientRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + currentUser.getId()));
        } else if (currentUser.getRole() == Role.ADMIN) {
            if (request.getPatientId() == null) {
                throw new BadRequestException("Patient ID is required when booking as Admin");
            }
            patient = patientRepository.findById(request.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", request.getPatientId()));
        } else {
            throw new UnauthorizedException("Doctors cannot book appointments for themselves");
        }

        // 3. Resolve Doctor
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        if (!doctor.isActive()) {
            throw new BadRequestException("Selected doctor is currently not taking appointments");
        }

        // 4. Validate doctor availability window
        LocalDate appointmentDate = request.getStartTime().toLocalDate();
        LocalTime startTime = request.getStartTime().toLocalTime();
        LocalTime endTime = request.getEndTime().toLocalTime();

        DoctorAvailability availability = availabilityRepository.findByDoctorIdAndAvailableDate(doctor.getId(), appointmentDate)
                .orElseThrow(() -> new BadRequestException("Doctor is not scheduled for consultations on " + appointmentDate));

        if (startTime.isBefore(availability.getStartTime()) || endTime.isAfter(availability.getEndTime())) {
            throw new BadRequestException(String.format("Requested time is outside doctor's consultation hours (%s - %s)",
                    availability.getStartTime(), availability.getEndTime()));
        }

        // 5. Concurrency-Safe Overlap Validation for Doctor
        long doctorOverlaps = appointmentRepository.countDoctorOverlappingAppointments(
                doctor.getId(),
                request.getStartTime(),
                request.getEndTime(),
                Arrays.asList(AppointmentStatus.CANCELLED)
        );

        if (doctorOverlaps > 0) {
            logger.warn("Booking conflict detected: Doctor ID {} already has an active appointment in interval [{}, {}]",
                    doctor.getId(), request.getStartTime(), request.getEndTime());
            throw new AppointmentConflictException("Doctor already has an appointment booked for this time slot. Please choose another slot.");
        }

        // 6. Overlap Validation for Patient
        long patientOverlaps = appointmentRepository.countPatientOverlappingAppointments(
                patient.getId(),
                request.getStartTime(),
                request.getEndTime(),
                Arrays.asList(AppointmentStatus.CANCELLED)
        );

        if (patientOverlaps > 0) {
            throw new AppointmentConflictException("You already have an existing appointment scheduled during this time slot.");
        }

        // 7. Persist Appointment
        Appointment appointment = new Appointment(
                patient,
                doctor,
                request.getStartTime(),
                request.getEndTime(),
                AppointmentStatus.CONFIRMED,
                request.getReason()
        );

        appointment = appointmentRepository.save(appointment);

        // 8. Log Audit Trail
        auditService.logAction(currentUser.getId(), "BOOK_APPOINTMENT", "Appointment", appointment.getId(),
                String.format("Appointment booked with Dr. %s for %s",
                        doctor.getUser().getFullName(), request.getStartTime()));

        // 9. Dispatch Asynchronous Event
        eventPublisher.publishAppointmentBooked(
                appointment.getId(),
                patient.getId(),
                patient.getUser().getId(),
                doctor.getId(),
                doctor.getUser().getId(),
                appointment.getStartTime(),
                appointment.getEndTime()
        );

        return EntityMapper.toAppointmentDTO(appointment);
    }

    @Transactional
    public AppointmentDTO updateStatus(Long appointmentId, UpdateAppointmentStatusRequest request, UserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        AppointmentStatus targetStatus = request.getStatus();

        // Access control checks
        if (currentUser.getRole() == Role.PATIENT) {
            if (!appointment.getPatient().getUser().getId().equals(currentUser.getId())) {
                throw new UnauthorizedException("You are not authorized to modify another patient's appointment");
            }
            if (targetStatus != AppointmentStatus.CANCELLED) {
                throw new BadRequestException("Patients can only cancel their appointments");
            }
            if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
                throw new BadRequestException("Cannot cancel an appointment that has already been completed");
            }
        } else if (currentUser.getRole() == Role.DOCTOR) {
            if (!appointment.getDoctor().getUser().getId().equals(currentUser.getId())) {
                throw new UnauthorizedException("You are not authorized to modify appointments assigned to other doctors");
            }
            if (targetStatus != AppointmentStatus.COMPLETED && targetStatus != AppointmentStatus.CANCELLED && targetStatus != AppointmentStatus.CONFIRMED) {
                throw new BadRequestException("Doctors can only mark appointments as CONFIRMED, COMPLETED or CANCELLED");
            }
        }

        appointment.setStatus(targetStatus);
        if (request.getReason() != null && !request.getReason().isBlank()) {
            appointment.setReason((appointment.getReason() != null ? appointment.getReason() + " | " : "") +
                    "Status changed to " + targetStatus + ": " + request.getReason());
        }

        appointment = appointmentRepository.save(appointment);

        auditService.logAction(currentUser.getId(), "UPDATE_APPOINTMENT_STATUS", "Appointment", appointment.getId(),
                "Status updated to " + targetStatus);

        return EntityMapper.toAppointmentDTO(appointment);
    }

    @Transactional(readOnly = true)
    public AppointmentDTO getAppointmentById(Long appointmentId, UserPrincipal currentUser) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment", "id", appointmentId));

        // Ownership enforcement
        if (currentUser.getRole() == Role.PATIENT && !appointment.getPatient().getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied to this appointment");
        } else if (currentUser.getRole() == Role.DOCTOR && !appointment.getDoctor().getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Access denied to this appointment");
        }

        return EntityMapper.toAppointmentDTO(appointment);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AppointmentDTO> getAppointments(AppointmentStatus status, Long doctorId, Long patientId,
                                                         LocalDateTime startDate, LocalDateTime endDate,
                                                         int page, int size, UserPrincipal currentUser) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "startTime"));

        // Scope queries strictly by role
        if (currentUser.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found"));
            patientId = patient.getId();
        } else if (currentUser.getRole() == Role.DOCTOR) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found"));
            doctorId = doctor.getId();
        }

        Page<Appointment> appointmentPage = appointmentRepository.searchAppointments(status, doctorId, patientId, startDate, endDate, pageable);

        List<AppointmentDTO> content = appointmentPage.getContent().stream()
                .map(EntityMapper::toAppointmentDTO)
                .collect(Collectors.toList());

        return new PagedResponse<>(content, appointmentPage.getNumber(), appointmentPage.getSize(),
                appointmentPage.getTotalElements(), appointmentPage.getTotalPages(), appointmentPage.isLast());
    }

    @Transactional(readOnly = true)
    public List<AppointmentDTO> getDoctorDailySchedule(Long doctorId, LocalDate date, UserPrincipal currentUser) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        if (currentUser.getRole() == Role.DOCTOR && !doctor.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("Doctors can only view their own daily schedule");
        }

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        return appointmentRepository.findDoctorDailySchedule(doctorId, startOfDay, endOfDay).stream()
                .map(EntityMapper::toAppointmentDTO)
                .collect(Collectors.toList());
    }
}
