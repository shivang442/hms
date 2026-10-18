package com.hospital.hms.dto.notification;

import com.hospital.hms.entity.NotificationStatus;
import com.hospital.hms.entity.NotificationType;
import java.io.Serializable;
import java.time.LocalDateTime;

public class NotificationDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long userId;
    private Long appointmentId;
    private NotificationType notificationType;
    private String message;
    private NotificationStatus status;
    private LocalDateTime createdAt;

    public NotificationDTO() {
    }

    public NotificationDTO(Long id, Long userId, Long appointmentId, NotificationType notificationType,
                           String message, NotificationStatus status, LocalDateTime createdAt) {
        this.id = id;
        this.userId = userId;
        this.appointmentId = appointmentId;
        this.notificationType = notificationType;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public NotificationType getNotificationType() {
        return notificationType;
    }

    public void setNotificationType(NotificationType notificationType) {
        this.notificationType = notificationType;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public NotificationStatus getStatus() {
        return status;
    }

    public void setStatus(NotificationStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
