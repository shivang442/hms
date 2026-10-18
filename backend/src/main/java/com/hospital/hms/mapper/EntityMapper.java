package com.hospital.hms.mapper;

import com.hospital.hms.dto.appointment.AppointmentDTO;
import com.hospital.hms.dto.audit.AuditLogDTO;
import com.hospital.hms.dto.availability.AvailabilityDTO;
import com.hospital.hms.dto.doctor.DoctorDTO;
import com.hospital.hms.dto.notification.NotificationDTO;
import com.hospital.hms.dto.patient.PatientDTO;
import com.hospital.hms.entity.*;

public class EntityMapper {

    public static DoctorDTO toDoctorDTO(Doctor doctor) {
        if (doctor == null) return null;
        return new DoctorDTO(
                doctor.getId(),
                doctor.getUser() != null ? doctor.getUser().getId() : null,
                doctor.getUser() != null ? doctor.getUser().getFullName() : null,
                doctor.getUser() != null ? doctor.getUser().getEmail() : null,
                doctor.getSpecialization(),
                doctor.getQualification(),
                doctor.getExperienceYears(),
                doctor.getConsultationFee(),
                doctor.getBiography(),
                doctor.isActive(),
                doctor.getCreatedAt()
        );
    }

    public static PatientDTO toPatientDTO(Patient patient) {
        if (patient == null) return null;
        return new PatientDTO(
                patient.getId(),
                patient.getUser() != null ? patient.getUser().getId() : null,
                patient.getUser() != null ? patient.getUser().getFullName() : null,
                patient.getUser() != null ? patient.getUser().getEmail() : null,
                patient.getDateOfBirth(),
                patient.getPhone(),
                patient.getAddress(),
                patient.getEmergencyContact(),
                patient.getUser() != null && patient.getUser().isActive(),
                patient.getCreatedAt()
        );
    }

    public static AppointmentDTO toAppointmentDTO(Appointment appointment) {
        if (appointment == null) return null;
        return new AppointmentDTO(
                appointment.getId(),
                appointment.getPatient() != null ? appointment.getPatient().getId() : null,
                (appointment.getPatient() != null && appointment.getPatient().getUser() != null) ? appointment.getPatient().getUser().getId() : null,
                (appointment.getPatient() != null && appointment.getPatient().getUser() != null) ? appointment.getPatient().getUser().getFullName() : null,
                appointment.getPatient() != null ? appointment.getPatient().getPhone() : null,
                appointment.getDoctor() != null ? appointment.getDoctor().getId() : null,
                (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null) ? appointment.getDoctor().getUser().getId() : null,
                (appointment.getDoctor() != null && appointment.getDoctor().getUser() != null) ? appointment.getDoctor().getUser().getFullName() : null,
                appointment.getDoctor() != null ? appointment.getDoctor().getSpecialization() : null,
                appointment.getDoctor() != null ? appointment.getDoctor().getConsultationFee() : null,
                appointment.getStartTime(),
                appointment.getEndTime(),
                appointment.getStatus(),
                appointment.getReason(),
                appointment.getCreatedAt(),
                appointment.getUpdatedAt()
        );
    }

    public static AvailabilityDTO toAvailabilityDTO(DoctorAvailability availability) {
        if (availability == null) return null;
        return new AvailabilityDTO(
                availability.getId(),
                availability.getDoctor() != null ? availability.getDoctor().getId() : null,
                (availability.getDoctor() != null && availability.getDoctor().getUser() != null) ? availability.getDoctor().getUser().getFullName() : null,
                availability.getDoctor() != null ? availability.getDoctor().getSpecialization() : null,
                availability.getAvailableDate(),
                availability.getStartTime(),
                availability.getEndTime(),
                availability.getSlotDurationMinutes()
        );
    }

    public static NotificationDTO toNotificationDTO(Notification notification) {
        if (notification == null) return null;
        return new NotificationDTO(
                notification.getId(),
                notification.getUser() != null ? notification.getUser().getId() : null,
                notification.getAppointment() != null ? notification.getAppointment().getId() : null,
                notification.getNotificationType(),
                notification.getMessage(),
                notification.getStatus(),
                notification.getCreatedAt()
        );
    }

    public static AuditLogDTO toAuditLogDTO(AuditLog log, User user) {
        if (log == null) return null;
        return new AuditLogDTO(
                log.getId(),
                log.getUserId(),
                user != null ? user.getEmail() : null,
                user != null ? user.getFullName() : null,
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetails(),
                log.getCreatedAt()
        );
    }
}
