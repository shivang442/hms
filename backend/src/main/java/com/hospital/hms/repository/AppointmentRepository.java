package com.hospital.hms.repository;

import com.hospital.hms.entity.Appointment;
import com.hospital.hms.entity.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.status NOT IN :excludedStatuses " +
           "AND a.startTime < :endTime AND a.endTime > :startTime")
    long countDoctorOverlappingAppointments(@Param("doctorId") Long doctorId,
                                           @Param("startTime") LocalDateTime startTime,
                                           @Param("endTime") LocalDateTime endTime,
                                           @Param("excludedStatuses") Collection<AppointmentStatus> excludedStatuses);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient.id = :patientId " +
           "AND a.status NOT IN :excludedStatuses " +
           "AND a.startTime < :endTime AND a.endTime > :startTime")
    long countPatientOverlappingAppointments(@Param("patientId") Long patientId,
                                            @Param("startTime") LocalDateTime startTime,
                                            @Param("endTime") LocalDateTime endTime,
                                            @Param("excludedStatuses") Collection<AppointmentStatus> excludedStatuses);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.status NOT IN :excludedStatuses " +
           "AND a.startTime >= :dayStart AND a.startTime < :dayEnd ORDER BY a.startTime ASC")
    List<Appointment> findDoctorBookingsOnDay(@Param("doctorId") Long doctorId,
                                             @Param("dayStart") LocalDateTime dayStart,
                                             @Param("dayEnd") LocalDateTime dayEnd,
                                             @Param("excludedStatuses") Collection<AppointmentStatus> excludedStatuses);

    Page<Appointment> findByPatientId(Long patientId, Pageable pageable);

    Page<Appointment> findByPatientIdAndStatus(Long patientId, AppointmentStatus status, Pageable pageable);

    Page<Appointment> findByDoctorId(Long doctorId, Pageable pageable);

    Page<Appointment> findByDoctorIdAndStatus(Long doctorId, AppointmentStatus status, Pageable pageable);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.startTime >= :dayStart AND a.startTime < :dayEnd ORDER BY a.startTime ASC")
    List<Appointment> findDoctorDailySchedule(@Param("doctorId") Long doctorId,
                                              @Param("dayStart") LocalDateTime dayStart,
                                              @Param("dayEnd") LocalDateTime dayEnd);

    @Query("SELECT a FROM Appointment a WHERE " +
           "(:status IS NULL OR a.status = :status) AND " +
           "(:doctorId IS NULL OR a.doctor.id = :doctorId) AND " +
           "(:patientId IS NULL OR a.patient.id = :patientId) AND " +
           "(:startDate IS NULL OR a.startTime >= :startDate) AND " +
           "(:endDate IS NULL OR a.startTime <= :endDate)")
    Page<Appointment> searchAppointments(@Param("status") AppointmentStatus status,
                                        @Param("doctorId") Long doctorId,
                                        @Param("patientId") Long patientId,
                                        @Param("startDate") LocalDateTime startDate,
                                        @Param("endDate") LocalDateTime endDate,
                                        Pageable pageable);

    long countByStatus(AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.createdAt >= :startOfDay AND a.createdAt < :endOfDay")
    long countBookingsToday(@Param("startOfDay") LocalDateTime startOfDay,
                            @Param("endOfDay") LocalDateTime endOfDay);
}
