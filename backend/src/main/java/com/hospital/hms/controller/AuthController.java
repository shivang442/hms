package com.hospital.hms.controller;

import com.hospital.hms.dto.auth.AuthResponse;
import com.hospital.hms.dto.auth.LoginRequest;
import com.hospital.hms.dto.auth.RegisterRequest;
import com.hospital.hms.dto.common.ApiResponse;
import com.hospital.hms.security.UserPrincipal;
import com.hospital.hms.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse authResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponse authResponse = authService.registerUser(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("User registered successfully", authResponse));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Not authenticated"));
        }

        Long roleEntityId = authService.resolveRoleEntityId(userPrincipal.getId(), userPrincipal.getRole());

        AuthResponse authResponse = new AuthResponse(
                null,
                userPrincipal.getId(),
                roleEntityId,
                userPrincipal.getUsername(),
                userPrincipal.getFullName(),
                userPrincipal.getRole()
        );

        return ResponseEntity.ok(ApiResponse.success("Current user profile retrieved", authResponse));
    }
}
