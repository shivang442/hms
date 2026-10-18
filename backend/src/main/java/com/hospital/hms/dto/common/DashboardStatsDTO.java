package com.hospital.hms.dto.common;

import java.util.Map;

public class DashboardStatsDTO {
    private long totalPatients;
    private long totalDoctors;
    private long totalAppointments;
    private long todayBookings;
    private long pendingAppointments;
    private long confirmedAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private Map<String, Long> appointmentsBySpecialization;

    public DashboardStatsDTO() {
    }

    public DashboardStatsDTO(long totalPatients, long totalDoctors, long totalAppointments, long todayBookings,
                             long pendingAppointments, long confirmedAppointments, long completedAppointments,
                             long cancelledAppointments, Map<String, Long> appointmentsBySpecialization) {
        this.totalPatients = totalPatients;
        this.totalDoctors = totalDoctors;
        this.totalAppointments = totalAppointments;
        this.todayBookings = todayBookings;
        this.pendingAppointments = pendingAppointments;
        this.confirmedAppointments = confirmedAppointments;
        this.completedAppointments = completedAppointments;
        this.cancelledAppointments = cancelledAppointments;
        this.appointmentsBySpecialization = appointmentsBySpecialization;
    }

    // Getters and Setters
    public long getTotalPatients() {
        return totalPatients;
    }

    public void setTotalPatients(long totalPatients) {
        this.totalPatients = totalPatients;
    }

    public long getTotalDoctors() {
        return totalDoctors;
    }

    public void setTotalDoctors(long totalDoctors) {
        this.totalDoctors = totalDoctors;
    }

    public long getTotalAppointments() {
        return totalAppointments;
    }

    public void setTotalAppointments(long totalAppointments) {
        this.totalAppointments = totalAppointments;
    }

    public long getTodayBookings() {
        return todayBookings;
    }

    public void setTodayBookings(long todayBookings) {
        this.todayBookings = todayBookings;
    }

    public long getPendingAppointments() {
        return pendingAppointments;
    }

    public void setPendingAppointments(long pendingAppointments) {
        this.pendingAppointments = pendingAppointments;
    }

    public long getConfirmedAppointments() {
        return confirmedAppointments;
    }

    public void setConfirmedAppointments(long confirmedAppointments) {
        this.confirmedAppointments = confirmedAppointments;
    }

    public long getCompletedAppointments() {
        return completedAppointments;
    }

    public void setCompletedAppointments(long completedAppointments) {
        this.completedAppointments = completedAppointments;
    }

    public long getCancelledAppointments() {
        return cancelledAppointments;
    }

    public void setCancelledAppointments(long cancelledAppointments) {
        this.cancelledAppointments = cancelledAppointments;
    }

    public Map<String, Long> getAppointmentsBySpecialization() {
        return appointmentsBySpecialization;
    }

    public void setAppointmentsBySpecialization(Map<String, Long> appointmentsBySpecialization) {
        this.appointmentsBySpecialization = appointmentsBySpecialization;
    }
}
