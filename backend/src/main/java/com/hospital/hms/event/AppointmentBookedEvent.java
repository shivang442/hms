package com.hospital.hms.event;

import java.io.Serializable;
import java.time.LocalDateTime;

public class AppointmentBookedEvent implements Serializable {
    private static final long serialVersionUID = 1L;

    private String eventId;
    private Long appointmentId;
    private Long patientId;
    private Long patientUserId;
    private Long doctorId;
    private Long doctorUserId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime timestamp;

    public AppointmentBookedEvent() {
    }

    public AppointmentBookedEvent(String eventId, Long appointmentId, Long patientId, Long patientUserId,
                                  Long doctorId, Long doctorUserId, LocalDateTime startTime, LocalDateTime endTime) {
        this.eventId = eventId;
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.patientUserId = patientUserId;
        this.doctorId = doctorId;
        this.doctorUserId = doctorUserId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public Long getAppointmentId() {
        return appointmentId;
    }

    public void setAppointmentId(Long appointmentId) {
        this.appointmentId = appointmentId;
    }

    public Long getPatientId() {
        return patientId;
    }

    public void setPatientId(Long patientId) {
        this.patientId = patientId;
    }

    public Long getPatientUserId() {
        return patientUserId;
    }

    public void setPatientUserId(Long patientUserId) {
        this.patientUserId = patientUserId;
    }

    public Long getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(Long doctorId) {
        this.doctorId = doctorId;
    }

    public Long getDoctorUserId() {
        return doctorUserId;
    }

    public void setDoctorUserId(Long doctorUserId) {
        this.doctorUserId = doctorUserId;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
