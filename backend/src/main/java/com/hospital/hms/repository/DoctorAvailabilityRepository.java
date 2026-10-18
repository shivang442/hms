package com.hospital.hms.repository;

import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {
    List<DoctorAvailability> findByDoctorAndAvailableDateGreaterThanEqualOrderByAvailableDateAscStartTimeAsc(
            Doctor doctor, LocalDate date);

    List<DoctorAvailability> findByDoctorIdAndAvailableDateOrderByStartTimeAsc(Long doctorId, LocalDate date);

    Optional<DoctorAvailability> findByDoctorIdAndAvailableDate(Long doctorId, LocalDate date);

    List<DoctorAvailability> findByDoctorIdOrderByAvailableDateAscStartTimeAsc(Long doctorId);
}
