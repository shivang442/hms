package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.doctor.CreateDoctorRequest;
import com.hospital.hms.dto.doctor.DoctorDTO;
import com.hospital.hms.dto.doctor.UpdateDoctorRequest;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DoctorServiceTest {

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DoctorService doctorService;

    private User docUser;
    private Doctor doctor;

    @BeforeEach
    void setUp() {
        docUser = new User("Dr. Gregory House", "house@diagnostics.com", "hash", Role.DOCTOR);
        docUser.setId(10L);
        doctor = new Doctor(docUser, "Diagnostic Medicine", "MD", 20, new BigDecimal("250.00"), "Diagnostician");
        doctor.setId(100L);
    }

    @Test
    @DisplayName("Retrieve doctor by ID successfully")
    void getDoctorById_Success() {
        when(doctorRepository.findById(100L)).thenReturn(Optional.of(doctor));

        DoctorDTO result = doctorService.getDoctorById(100L);

        assertNotNull(result);
        assertEquals("Dr. Gregory House", result.getFullName());
        assertEquals("Diagnostic Medicine", result.getSpecialization());
    }

    @Test
    @DisplayName("Throws ResourceNotFoundException when doctor ID does not exist")
    void getDoctorById_NotFound() {
        when(doctorRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> doctorService.getDoctorById(999L));
    }

    @Test
    @DisplayName("Create doctor with unique email succeeds")
    void createDoctor_Success() {
        CreateDoctorRequest request = new CreateDoctorRequest("Dr. Allison Cameron", "cameron@test.com", "password",
                "Immunology", "MD", 7, new BigDecimal("140.00"), "Immunologist");

        when(userRepository.existsByEmail("cameron@test.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedSecret");

        User savedUser = new User(request.getFullName(), request.getEmail(), "encodedSecret", Role.DOCTOR);
        savedUser.setId(11L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Doctor savedDoctor = new Doctor(savedUser, request.getSpecialization(), request.getQualification(),
                request.getExperienceYears(), request.getConsultationFee(), request.getBiography());
        savedDoctor.setId(101L);
        when(doctorRepository.save(any(Doctor.class))).thenReturn(savedDoctor);

        DoctorDTO result = doctorService.createDoctor(request, 1L);

        assertNotNull(result);
        assertEquals(101L, result.getId());
        assertEquals("Immunology", result.getSpecialization());
        verify(auditService, times(1)).logAction(eq(1L), eq("CREATE_DOCTOR"), eq("Doctor"), eq(101L), anyString());
    }

    @Test
    @DisplayName("Deactivate doctor sets active status to false")
    void deactivateDoctor_Success() {
        when(doctorRepository.findById(100L)).thenReturn(Optional.of(doctor));

        doctorService.deactivateDoctor(100L, 1L);

        assertFalse(doctor.isActive());
        assertFalse(doctor.getUser().isActive());
        verify(doctorRepository, times(1)).save(doctor);
    }

    @Test
    @DisplayName("Retrieve all distinct specializations")
    void getAllSpecializations_Success() {
        when(doctorRepository.findDistinctSpecializations()).thenReturn(List.of("Cardiology", "Neurology", "Pediatrics"));

        List<String> specs = doctorService.getAllSpecializations();

        assertEquals(3, specs.size());
        assertTrue(specs.contains("Cardiology"));
    }
}
