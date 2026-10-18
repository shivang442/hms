package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.auth.AuthResponse;
import com.hospital.hms.dto.auth.LoginRequest;
import com.hospital.hms.dto.auth.RegisterRequest;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.security.JwtTokenProvider;
import com.hospital.hms.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private UserPrincipal userPrincipal;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        sampleUser = new User("Jane Smith", "jane@example.com", "encodedPassword", Role.PATIENT);
        sampleUser.setId(5L);

        userPrincipal = new UserPrincipal(sampleUser.getId(), sampleUser.getFullName(),
                sampleUser.getEmail(), sampleUser.getPasswordHash(), sampleUser.getRole(), true, Collections.emptyList());

        authentication = mock(Authentication.class);
    }

    @Test
    @DisplayName("Successful login generates JWT token and returns user details")
    void authenticateUser_Success() {
        LoginRequest request = new LoginRequest("jane@example.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userPrincipal);
        when(tokenProvider.generateToken(authentication)).thenReturn("jwt.token.here");

        AuthResponse response = authService.authenticateUser(request);

        assertNotNull(response);
        assertEquals("jwt.token.here", response.getToken());
        assertEquals("jane@example.com", response.getEmail());
        assertEquals(Role.PATIENT, response.getRole());
    }

    @Test
    @DisplayName("Register with duplicate email throws BadRequestException")
    void registerUser_DuplicateEmail_ThrowsBadRequest() {
        RegisterRequest request = new RegisterRequest("Existing User", "existing@example.com", "password",
                Role.PATIENT, LocalDate.of(1990, 1, 1), "1234567890", "Address", "Contact");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.registerUser(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Successful registration creates user and patient profile")
    void registerUser_Success() {
        RegisterRequest request = new RegisterRequest("New Patient", "new@example.com", "password",
                Role.PATIENT, LocalDate.of(1995, 5, 20), "5551234567", "Street", "Emergency");

        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("encodedSecret");

        User savedUser = new User(request.getFullName(), request.getEmail(), "encodedSecret", Role.PATIENT);
        savedUser.setId(50L);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Patient savedPatient = new Patient(savedUser, request.getDateOfBirth(), request.getPhone(), request.getAddress(), request.getEmergencyContact());
        savedPatient.setId(100L);
        when(patientRepository.save(any(Patient.class))).thenReturn(savedPatient);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        when(tokenProvider.generateToken(authentication)).thenReturn("jwt.registered.token");

        AuthResponse response = authService.registerUser(request);

        assertNotNull(response);
        assertEquals(50L, response.getId());
        assertEquals(100L, response.getRoleEntityId());
        assertEquals("new@example.com", response.getEmail());
    }
}
