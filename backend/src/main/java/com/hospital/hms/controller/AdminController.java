package com.hospital.hms.controller;

import com.hospital.hms.audit.AuditService;
import com.hospital.hms.dto.audit.AuditLogDTO;
import com.hospital.hms.dto.common.ApiResponse;
import com.hospital.hms.dto.common.DashboardStatsDTO;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.entity.Role;
import com.hospital.hms.entity.User;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.repository.UserRepository;
import com.hospital.hms.security.UserPrincipal;
import com.hospital.hms.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminDashboardService dashboardService;
    private final AuditService auditService;
    private final UserRepository userRepository;

    @Autowired
    public AdminController(AdminDashboardService dashboardService,
                           AuditService auditService,
                           UserRepository userRepository) {
        this.dashboardService = dashboardService;
        this.auditService = auditService;
        this.userRepository = userRepository;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsDTO>> getDashboardStatistics() {
        DashboardStatsDTO stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Hospital statistics retrieved", stats));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogDTO>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        PagedResponse<AuditLogDTO> auditLogs = auditService.getAllAuditLogs(page, size);
        return ResponseEntity.ok(ApiResponse.success("Audit logs retrieved", auditLogs));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Page<User>>> getUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = (role != null) ? userRepository.findByRole(role, pageable) : userRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved", users));
    }

    @PatchMapping("/users/{userId}/toggle-status")
    public ResponseEntity<ApiResponse<User>> toggleUserStatus(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        user.setActive(!user.isActive());
        user = userRepository.save(user);

        auditService.logAction(userPrincipal.getId(), "TOGGLE_USER_STATUS", "User", user.getId(),
                "User " + user.getEmail() + " status changed to active=" + user.isActive());

        return ResponseEntity.ok(ApiResponse.success("User status toggled", user));
    }
}
