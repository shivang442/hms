package com.hospital.hms.controller;

import com.hospital.hms.dto.common.ApiResponse;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.dto.doctor.CreateDoctorRequest;
import com.hospital.hms.dto.doctor.DoctorDTO;
import com.hospital.hms.dto.doctor.UpdateDoctorRequest;
import com.hospital.hms.entity.Role;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.security.UserPrincipal;
import com.hospital.hms.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    @Autowired
    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<DoctorDTO>>> searchDoctors(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String specialization,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<DoctorDTO> doctors = doctorService.searchDoctors(query, specialization, activeOnly, page, size);
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved successfully", doctors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorDTO>> getDoctorById(@PathVariable Long id) {
        DoctorDTO doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor details retrieved", doctor));
    }

    @GetMapping("/specializations")
    public ResponseEntity<ApiResponse<List<String>>> getSpecializations() {
        List<String> specializations = doctorService.getAllSpecializations();
        return ResponseEntity.ok(ApiResponse.success("Specializations retrieved", specializations));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorDTO>> getMyDoctorProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        DoctorDTO doctor = doctorService.getDoctorByUserId(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Doctor profile retrieved", doctor));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<DoctorDTO>> createDoctor(
            @Valid @RequestBody CreateDoctorRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        DoctorDTO createdDoctor = doctorService.createDoctor(request, userPrincipal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Doctor created successfully", createdDoctor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR')")
    public ResponseEntity<ApiResponse<DoctorDTO>> updateDoctor(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDoctorRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal.getRole() == Role.DOCTOR) {
            DoctorDTO myDoctor = doctorService.getDoctorByUserId(userPrincipal.getId());
            if (!myDoctor.getId().equals(id)) {
                throw new UnauthorizedException("Doctors can only edit their own profile");
            }
        }
        DoctorDTO updatedDoctor = doctorService.updateDoctor(id, request, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Doctor updated successfully", updatedDoctor));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivateDoctor(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        doctorService.deactivateDoctor(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Doctor deactivated successfully"));
    }

    @PatchMapping("/{id}/activate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> activateDoctor(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        doctorService.activateDoctor(id, userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Doctor activated successfully"));
    }
}
