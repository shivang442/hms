package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.availability.AvailabilityDTO;
import com.hospital.hms.dto.availability.CreateAvailabilityRequest;
import com.hospital.hms.dto.availability.TimeSlotDTO;
import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.DoctorAvailability;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.mapper.EntityMapper;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorAvailabilityRepository;
import com.hospital.hms.repository.DoctorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AvailabilityService {

    private final DoctorAvailabilityRepository availabilityRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuditService auditService;

    @Autowired
    public AvailabilityService(DoctorAvailabilityRepository availabilityRepository,
                               DoctorRepository doctorRepository,
                               AppointmentRepository appointmentRepository,
                               AuditService auditService) {
        this.availabilityRepository = availabilityRepository;
        this.doctorRepository = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.auditService = auditService;
    }

    @Transactional
    public AvailabilityDTO setAvailability(CreateAvailabilityRequest request, Long actingUserId) {
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", request.getDoctorId()));

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        // Check if an entry already exists for this date; if so, update it
        DoctorAvailability availability = availabilityRepository
                .findByDoctorIdAndAvailableDate(doctor.getId(), request.getAvailableDate())
                .orElse(new DoctorAvailability());

        availability.setDoctor(doctor);
        availability.setAvailableDate(request.getAvailableDate());
        availability.setStartTime(request.getStartTime());
        availability.setEndTime(request.getEndTime());
        availability.setSlotDurationMinutes(request.getSlotDurationMinutes());

        availability = availabilityRepository.save(availability);

        auditService.logAction(actingUserId, "SET_AVAILABILITY", "DoctorAvailability", availability.getId(),
                "Set availability for Dr. " + doctor.getUser().getFullName() + " on " + request.getAvailableDate());

        return EntityMapper.toAvailabilityDTO(availability);
    }

    @Transactional(readOnly = true)
    public List<AvailabilityDTO> getDoctorAvailability(Long doctorId) {
        return availabilityRepository.findByDoctorIdOrderByAvailableDateAscStartTimeAsc(doctorId).stream()
                .map(EntityMapper::toAvailabilityDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TimeSlotDTO> getAvailableSlots(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        DoctorAvailability availability = availabilityRepository
                .findByDoctorIdAndAvailableDate(doctor.getId(), date)
                .orElse(null);

        if (availability == null) {
            return new ArrayList<>();
        }

        // Fetch existing bookings on that day that are NOT cancelled
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<Appointment> existingBookings = appointmentRepository.findDoctorBookingsOnDay(
                doctorId,
                dayStart,
                dayEnd,
                Arrays.asList(AppointmentStatus.CANCELLED)
        );

        List<TimeSlotDTO> slots = new ArrayList<>();
        LocalTime current = availability.getStartTime();
        LocalTime end = availability.getEndTime();
        int step = availability.getSlotDurationMinutes();

        LocalDateTime now = LocalDateTime.now();

        while (!current.plusMinutes(step).isAfter(end)) {
            LocalDateTime slotStart = LocalDateTime.of(date, current);
            LocalDateTime slotEnd = LocalDateTime.of(date, current.plusMinutes(step));

            boolean inPast = slotStart.isBefore(now);
            boolean isBooked = existingBookings.stream().anyMatch(booking ->
                    booking.getStartTime().isBefore(slotEnd) && booking.getEndTime().isAfter(slotStart)
            );

            boolean available = !inPast && !isBooked;
            slots.add(new TimeSlotDTO(slotStart, slotEnd, available));

            current = current.plusMinutes(step);
        }

        return slots;
    }
}
