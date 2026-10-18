package com.hospital.hms.controller;

import com.hospital.hms.dto.availability.AvailabilityDTO;
import com.hospital.hms.dto.availability.CreateAvailabilityRequest;
import com.hospital.hms.dto.availability.TimeSlotDTO;
import com.hospital.hms.dto.common.ApiResponse;
import com.hospital.hms.entity.Role;
import com.hospital.hms.security.UserPrincipal;
import com.hospital.hms.service.AvailabilityService;
import com.hospital.hms.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;
    private final DoctorService doctorService;

    @Autowired
    public AvailabilityController(AvailabilityService availabilityService, DoctorService doctorService) {
        this.availabilityService = availabilityService;
        this.doctorService = doctorService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<AvailabilityDTO>> setAvailability(
            @Valid @RequestBody CreateAvailabilityRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal.getRole() == Role.DOCTOR) {
            Long doctorId = doctorService.getDoctorByUserId(userPrincipal.getId()).getId();
            request.setDoctorId(doctorId);
        }
        AvailabilityDTO availability = availabilityService.setAvailability(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Availability updated successfully", availability));
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<ApiResponse<List<AvailabilityDTO>>> getDoctorAvailability(@PathVariable Long doctorId) {
        List<AvailabilityDTO> availabilityList = availabilityService.getDoctorAvailability(doctorId);
        return ResponseEntity.ok(ApiResponse.success("Doctor availability retrieved", availabilityList));
    }

    @GetMapping("/doctor/{doctorId}/slots")
    public ResponseEntity<ApiResponse<List<TimeSlotDTO>>> getAvailableSlots(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TimeSlotDTO> slots = availabilityService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(ApiResponse.success("Available slots calculated successfully", slots));
    }
}
