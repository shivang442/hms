package com.hospital.hms.repository;

import com.hospital.hms.entity.Doctor;
import com.hospital.hms.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByUser(User user);
    Optional<Doctor> findByUserId(Long userId);

    List<Doctor> findByActiveTrue();

    @Query("SELECT DISTINCT d.specialization FROM Doctor d WHERE d.active = true")
    List<String> findDistinctSpecializations();

    @Query("SELECT d FROM Doctor d JOIN d.user u WHERE " +
           "(:activeOnly = false OR d.active = true) AND " +
           "(:specialization IS NULL OR :specialization = '' OR LOWER(d.specialization) = LOWER(:specialization)) AND " +
           "(:query IS NULL OR :query = '' OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.specialization) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Doctor> searchDoctors(@Param("query") String query,
                              @Param("specialization") String specialization,
                              @Param("activeOnly") boolean activeOnly,
                              Pageable pageable);

    long countByActiveTrue();
}
