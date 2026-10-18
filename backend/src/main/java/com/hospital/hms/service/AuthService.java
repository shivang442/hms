package com.hospital.hms.service;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.auth.AuthResponse;
import com.hospital.hms.dto.auth.LoginRequest;
import com.hospital.hms.dto.auth.RegisterRequest;
import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.Patient;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.BadRequestException;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.security.JwtTokenProvider;
import com.hospital.hms.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuditService auditService;

    @Autowired
    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       PatientRepository patientRepository,
                       DoctorRepository doctorRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider,
                       AuditService auditService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.patientRepository = patientRepository;
        this.doctorRepository = doctorRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.auditService = auditService;
    }

    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Long roleEntityId = resolveRoleEntityId(userPrincipal.getId(), userPrincipal.getRole());

        auditService.logAction(userPrincipal.getId(), "USER_LOGIN", "User", userPrincipal.getId(), "User logged in successfully");

        return new AuthResponse(
                jwt,
                userPrincipal.getId(),
                roleEntityId,
                userPrincipal.getUsername(),
                userPrincipal.getFullName(),
                userPrincipal.getRole()
        );
    }

    @Transactional
    public AuthResponse registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new BadRequestException("Email is already registered: " + registerRequest.getEmail());
        }

        Role role = registerRequest.getRole() != null ? registerRequest.getRole() : Role.PATIENT;

        User user = new User(
                registerRequest.getFullName(),
                registerRequest.getEmail(),
                passwordEncoder.encode(registerRequest.getPassword()),
                role
        );
        user = userRepository.save(user);

        Long roleEntityId = null;

        if (role == Role.PATIENT) {
            Patient patient = new Patient(
                    user,
                    registerRequest.getDateOfBirth(),
                    registerRequest.getPhone(),
                    registerRequest.getAddress(),
                    registerRequest.getEmergencyContact()
            );
            patient = patientRepository.save(patient);
            roleEntityId = patient.getId();
        }

        auditService.logAction(user.getId(), "USER_REGISTERED", "User", user.getId(), "New user registered with role " + role);

        // Auto authenticate after registration
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(registerRequest.getEmail(), registerRequest.getPassword())
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        return new AuthResponse(
                jwt,
                user.getId(),
                roleEntityId,
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }

    public Long resolveRoleEntityId(Long userId, Role role) {
        if (role == Role.PATIENT) {
            return patientRepository.findByUserId(userId).map(Patient::getId).orElse(null);
        } else if (role == Role.DOCTOR) {
            return doctorRepository.findByUserId(userId).map(Doctor::getId).orElse(null);
        }
        return null;
    }
}
