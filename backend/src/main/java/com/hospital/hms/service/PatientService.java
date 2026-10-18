package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.dto.patient.PatientDTO;
import com.hospital.hms.dto.patient.UpdatePatientRequest;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Role;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.mapper.EntityMapper;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PatientService {

    private final PatientRepository patientRepository;
    private final AuditService auditService;

    @Autowired
    public PatientService(PatientRepository patientRepository, AuditService auditService) {
        this.patientRepository = patientRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<PatientDTO> searchPatients(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Patient> patientPage = patientRepository.searchPatients(query, pageable);

        List<PatientDTO> content = patientPage.getContent().stream()
                .map(EntityMapper::toPatientDTO)
                .collect(Collectors.toList());

        return new PagedResponse<>(content, patientPage.getNumber(), patientPage.getSize(),
                patientPage.getTotalElements(), patientPage.getTotalPages(), patientPage.isLast());
    }

    @Transactional(readOnly = true)
    public PatientDTO getPatientById(Long patientId, UserPrincipal currentUser) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        // Ownership & authorization check
        if (currentUser.getRole() == Role.PATIENT && !patient.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to view another patient's medical records");
        }

        return EntityMapper.toPatientDTO(patient);
    }

    @Transactional(readOnly = true)
    public PatientDTO getPatientByUserId(Long userId) {
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient profile not found for user: " + userId));
        return EntityMapper.toPatientDTO(patient);
    }

    @Transactional
    public PatientDTO updatePatient(Long patientId, UpdatePatientRequest request, UserPrincipal currentUser) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", "id", patientId));

        // Only ADMIN or the Patient themselves can update their details
        if (currentUser.getRole() == Role.PATIENT && !patient.getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You are not authorized to edit this patient profile");
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            patient.getUser().setFullName(request.getFullName());
        }
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setPhone(request.getPhone());
        patient.setAddress(request.getAddress());
        patient.setEmergencyContact(request.getEmergencyContact());

        patient = patientRepository.save(patient);

        auditService.logAction(currentUser.getId(), "UPDATE_PATIENT", "Patient", patient.getId(), "Patient details updated");

        return EntityMapper.toPatientDTO(patient);
    }
}
