package com.hospital.hms.controller;

import com.hospital.hms.dto.common.ApiResponse;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.dto.patient.PatientDTO;
import com.hospital.hms.dto.patient.UpdatePatientRequest;
import com.hospital.hms.security.UserPrincipal;
import com.hospital.hms.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    @Autowired
    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<PatientDTO>>> searchPatients(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<PatientDTO> patients = patientService.searchPatients(query, page, size);
        return ResponseEntity.ok(ApiResponse.success("Patients retrieved successfully", patients));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCTOR', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientDTO>> getPatientById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PatientDTO patient = patientService.getPatientById(id, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Patient details retrieved", patient));
    }

    @GetMapping("/profile/me")
    @PreAuthorize("hasRole('PATIENT')")
    public ResponseEntity<ApiResponse<PatientDTO>> getMyPatientProfile(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        PatientDTO patient = patientService.getPatientByUserId(userPrincipal.getId());
        return ResponseEntity.ok(ApiResponse.success("Patient profile retrieved", patient));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PATIENT')")
    public ResponseEntity<ApiResponse<PatientDTO>> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePatientRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        PatientDTO updatedPatient = patientService.updatePatient(id, request, userPrincipal);
        return ResponseEntity.ok(ApiResponse.success("Patient updated successfully", updatedPatient));
    }
}
