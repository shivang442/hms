package com.hospital.hms.dto.appointment;

import com.hospital.hms.entity.AppointmentStatus;
import jakarta.validation.constraints.NotNull;

public class UpdateAppointmentStatusRequest {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;

    private String reason;

    public UpdateAppointmentStatusRequest() {
    }

    public UpdateAppointmentStatusRequest(AppointmentStatus status, String reason) {
        this.status = status;
        this.reason = reason;
    }

    public AppointmentStatus getStatus() {
        return status;
    }

    public void setStatus(AppointmentStatus status) {
        this.status = status;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
