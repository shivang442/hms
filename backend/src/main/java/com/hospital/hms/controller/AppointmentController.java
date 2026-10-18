package com.hospital.hms.controller;

import com.hospital.hms.dto.appointment.AppointmentDTO;
import com.hospital.hms.dto.appointment.BookAppointmentRequest;
import com.hospital.hms.dto.appointment.UpdateAppointmentStatusRequest;
import com.hospital.hms.dto.common.ApiResponse;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.security.UserPrincipal;
import com.hospital.hms.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    @Autowired
    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<AppointmentDTO>> bookAppointment(
            @Valid @RequestBody BookAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AppointmentDTO appointment = appointmentService.bookAppointment(request, userPrincipal);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Appointment booked successfully", appointment));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AppointmentDTO>>> getAppointments(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PagedResponse<AppointmentDTO> appointments = appointmentService.getAppointments(
                status, doctorId, patientId, startDate, endDate, page, size, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved successfully", appointments));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentDTO>> getAppointmentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AppointmentDTO appointment = appointmentService.getAppointmentById(id, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Appointment details retrieved", appointment));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AppointmentDTO>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        AppointmentDTO appointment = appointmentService.updateStatus(id, request, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Appointment status updated to " + appointment.getStatus(), appointment));
    }

    @GetMapping("/doctor/{doctorId}/schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<List<AppointmentDTO>>> getDoctorDailySchedule(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        List<AppointmentDTO> schedule = appointmentService.getDoctorDailySchedule(doctorId, date, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Doctor daily schedule retrieved", schedule));
    }
}
