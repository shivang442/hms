package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.patient.PatientDTO;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.UnauthorizedException;
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

import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private PatientService patientService;

    private User patientUser1;
    private Patient patient1;
    private UserPrincipal patient1Principal;

    private User patientUser2;
    private Patient patient2;

    @BeforeEach
    void setUp() {
        patientUser1 = new User("Alice Patient", "alice@test.com", "hash", Role.PATIENT);
        patientUser1.setId(1L);
        patient1 = new Patient(patientUser1, LocalDate.of(1992, 4, 15), "1111111111", "123 Main St", "Bob - 2222222222");
        patient1.setId(10L);

        patient1Principal = new UserPrincipal(patientUser1.getId(), patientUser1.getFullName(),
                patientUser1.getEmail(), patientUser1.getPasswordHash(), Role.PATIENT, true,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_PATIENT")));

        patientUser2 = new User("Bob Patient", "bob@test.com", "hash", Role.PATIENT);
        patientUser2.setId(2L);
        patient2 = new Patient(patientUser2, LocalDate.of(1985, 8, 20), "3333333333", "456 Oak St", "Carol - 4444444444");
        patient2.setId(20L);
    }

    @Test
    @DisplayName("Patient can view their own record")
    void getPatientById_OwnRecord_Success() {
        when(patientRepository.findById(10L)).thenReturn(Optional.of(patient1));

        PatientDTO result = patientService.getPatientById(10L, patient1Principal);

        assertNotNull(result);
        assertEquals("Alice Patient", result.getFullName());
    }

    @Test
    @DisplayName("Patient cannot view another patient's medical record")
    void getPatientById_OtherRecord_ThrowsUnauthorized() {
        when(patientRepository.findById(20L)).thenReturn(Optional.of(patient2));

        assertThrows(UnauthorizedException.class, () -> patientService.getPatientById(20L, patient1Principal));
    }
}
