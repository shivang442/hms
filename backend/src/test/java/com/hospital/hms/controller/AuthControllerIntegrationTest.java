package com.hospital.hms.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hospital.hms.dto.auth.LoginRequest;
import com.hospital.hms.dto.auth.RegisterRequest;
import com.hospital.hms.entity.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/auth/login with valid seeded admin returns JWT")
    void testLogin_Success() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@hospital.com", "Password123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("admin@hospital.com"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/login with invalid credentials returns 401")
    void testLogin_BadCredentials() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@hospital.com", "WrongPassword!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value(containsString("Invalid email or password")));
    }

    @Test
    @DisplayName("POST /api/auth/login with invalid email format returns 400 Validation Error")
    void testLogin_InvalidFormInputs() throws Exception {
        LoginRequest invalidRequest = new LoginRequest("not-an-email", "123"); // Short password & invalid email

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.password").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register creates new patient successfully")
    void testRegister_Success() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "New Integrated Patient",
                "integration.patient@example.com",
                "SecurePassword123!",
                Role.PATIENT,
                LocalDate.of(1993, 7, 12),
                "+1-555-987-6543",
                "777 Test Parkway",
                "Contact Person"
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.email").value("integration.patient@example.com"))
                .andExpect(jsonPath("$.data.role").value("PATIENT"));
    }
}
