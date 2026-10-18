package com.hospital.hms.service;

import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.dto.notification.NotificationDTO;
import com.hospital.hms.entity.Notification;
import com.hospital.hms.entity.NotificationStatus;
import com.hospital.hms.exception.ResourceNotFoundException;
import com.hospital.hms.exception.UnauthorizedException;
import com.hospital.hms.mapper.EntityMapper;
import com.hospital.hms.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional(readOnly = true)
    public PagedResponse<NotificationDTO> getUserNotifications(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationDTO> content = notificationPage.getContent().stream()
                .map(EntityMapper::toNotificationDTO)
                .collect(Collectors.toList());

        return new PagedResponse<>(content, notificationPage.getNumber(), notificationPage.getSize(),
                notificationPage.getTotalElements(), notificationPage.getTotalPages(), notificationPage.isLast());
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getRecentNotifications(Long userId) {
        return notificationRepository.findTop10ByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(EntityMapper::toNotificationDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndStatus(userId, NotificationStatus.UNREAD);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (!notification.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Access denied to notification");
        }

        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadForUser(userId);
    }
}
