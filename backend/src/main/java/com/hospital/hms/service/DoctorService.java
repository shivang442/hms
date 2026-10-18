package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.dto.doctor.CreateDoctorRequest;
import com.hospital.hms.dto.doctor.DoctorDTO;
import com.hospital.hms.dto.doctor.UpdateDoctorRequest;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.mapper.EntityMapper;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DoctorService {

    private static final Logger logger = LoggerFactory.getLogger(DoctorService.class);

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Autowired
    public DoctorService(DoctorRepository doctorRepository,
                         UserRepository userRepository,
                         PasswordEncoder passwordEncoder,
                         AuditService auditService) {
        this.doctorRepository = doctorRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PagedResponse<DoctorDTO> searchDoctors(String query, String specialization, boolean activeOnly, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Doctor> doctorPage = doctorRepository.searchDoctors(query, specialization, activeOnly, pageable);

        List<DoctorDTO> content = doctorPage.getContent().stream()
                .map(EntityMapper::toDoctorDTO)
                .collect(Collectors.toList());

        return new PagedResponse<>(content, doctorPage.getNumber(), doctorPage.getSize(),
                doctorPage.getTotalElements(), doctorPage.getTotalPages(), doctorPage.isLast());
    }

    @Cacheable(value = "doctorProfiles", key = "#id")
    @Transactional(readOnly = true)
    public DoctorDTO getDoctorById(Long id) {
        logger.info("CACHE MISS: Fetching doctor profile from database for doctorId: {}", id);
        Doctor doctor = doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", id));
        return EntityMapper.toDoctorDTO(doctor);
    }

    @Transactional(readOnly = true)
    public DoctorDTO getDoctorByUserId(Long userId) {
        Doctor doctor = doctorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found for user: " + userId));
        return EntityMapper.toDoctorDTO(doctor);
    }

    @Cacheable(value = "specializations")
    @Transactional(readOnly = true)
    public List<String> getAllSpecializations() {
        logger.info("CACHE MISS: Fetching distinct doctor specializations from database");
        return doctorRepository.findDistinctSpecializations();
    }

    @CacheEvict(value = {"doctorProfiles", "specializations"}, allEntries = true)
    @Transactional
    public DoctorDTO createDoctor(CreateDoctorRequest request, Long adminUserId) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use: " + request.getEmail());
        }

        User user = new User(
                request.getFullName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.DOCTOR
        );
        user = userRepository.save(user);

        Doctor doctor = new Doctor(
                user,
                request.getSpecialization(),
                request.getQualification(),
                request.getExperienceYears(),
                request.getConsultationFee(),
                request.getBiography()
        );
        doctor = doctorRepository.save(doctor);

        auditService.logAction(adminUserId, "CREATE_DOCTOR", "Doctor", doctor.getId(),
                "Doctor created with email " + user.getEmail() + " and specialization " + doctor.getSpecialization());

        return EntityMapper.toDoctorDTO(doctor);
    }

    @CacheEvict(value = {"doctorProfiles", "specializations"}, allEntries = true)
    @Transactional
    public DoctorDTO updateDoctor(Long doctorId, UpdateDoctorRequest request, Long actingUserId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            doctor.getUser().setFullName(request.getFullName());
        }
        doctor.setSpecialization(request.getSpecialization());
        doctor.setQualification(request.getQualification());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setBiography(request.getBiography());
        if (request.getActive() != null) {
            doctor.setActive(request.getActive());
            doctor.getUser().setActive(request.getActive());
        }

        doctor = doctorRepository.save(doctor);

        auditService.logAction(actingUserId, "UPDATE_DOCTOR", "Doctor", doctor.getId(),
                "Doctor profile updated");

        return EntityMapper.toDoctorDTO(doctor);
    }

    @CacheEvict(value = {"doctorProfiles", "specializations"}, allEntries = true)
    @Transactional
    public void deactivateDoctor(Long doctorId, Long adminUserId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        doctor.setActive(false);
        doctor.getUser().setActive(false);
        doctorRepository.save(doctor);

        auditService.logAction(adminUserId, "DEACTIVATE_DOCTOR", "Doctor", doctorId, "Doctor deactivated");
    }

    @CacheEvict(value = {"doctorProfiles", "specializations"}, allEntries = true)
    @Transactional
    public void activateDoctor(Long doctorId, Long adminUserId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor", "id", doctorId));

        doctor.setActive(true);
        doctor.getUser().setActive(true);
        doctorRepository.save(doctor);

        auditService.logAction(adminUserId, "ACTIVATE_DOCTOR", "Doctor", doctorId, "Doctor activated");
    }
}
