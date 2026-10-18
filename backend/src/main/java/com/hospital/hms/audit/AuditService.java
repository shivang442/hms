package com.hospital.hms.audit;

import com.hospital.hms.dto.audit.AuditLogDTO;
import com.hospital.hms.dto.common.PagedResponse;
import com.hospital.hms.entity.AuditLog;
import com.hospital.hms.entity.User;
import com.hospital.hms.mapper.EntityMapper;
import com.hospital.hms.repository.AuditLogRepository;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    @Autowired
    public AuditService(AuditLogRepository auditLogRepository, UserRepository userRepository) {
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    @Async
    @Transactional
    public void logAction(Long userId, String action, String entityType, Long entityId, String details) {
        AuditLog auditLog = new AuditLog(userId, action, entityType, entityId, details);
        auditLogRepository.save(auditLog);
    }

    @Transactional(readOnly = true)
    public PagedResponse<AuditLogDTO> getAllAuditLogs(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditLog> auditLogs = auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);

        List<Long> userIds = auditLogs.getContent().stream()
                .map(AuditLog::getUserId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> userMap = userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        List<AuditLogDTO> dtoList = auditLogs.getContent().stream()
                .map(log -> EntityMapper.toAuditLogDTO(log, log.getUserId() != null ? userMap.get(log.getUserId()) : null))
                .collect(Collectors.toList());

        return new PagedResponse<>(dtoList, auditLogs.getNumber(), auditLogs.getSize(),
                auditLogs.getTotalElements(), auditLogs.getTotalPages(), auditLogs.isLast());
    }
}
