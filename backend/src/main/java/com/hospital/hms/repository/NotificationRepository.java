package com.hospital.hms.repository;

import com.hospital.hms.entity.Notification;
import com.hospital.hms.entity.NotificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Notification> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndStatus(Long userId, NotificationStatus status);

    @Modifying
    @Query("UPDATE Notification n SET n.status = 'READ' WHERE n.user.id = :userId")
    int markAllAsReadForUser(@Param("userId") Long userId);

    boolean existsByUserIdAndAppointmentIdAndNotificationType(Long userId, Long appointmentId, com.hospital.hms.entity.NotificationType notificationType);
}
