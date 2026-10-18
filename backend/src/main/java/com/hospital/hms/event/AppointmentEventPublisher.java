package com.hospital.hms.event;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AppointmentEventPublisher {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentEventPublisher.class);

    @Value("${app.kafka.enabled:true}")
    private boolean kafkaEnabled;

    @Value("${app.kafka.topics.appointment-events:appointment-events}")
    private String topicName;

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final ApplicationEventPublisher applicationEventPublisher;

    @Autowired
    public AppointmentEventPublisher(@Autowired(required = false) KafkaTemplate<String, Object> kafkaTemplate,
                                     ApplicationEventPublisher applicationEventPublisher) {
        this.kafkaTemplate = kafkaTemplate;
        this.applicationEventPublisher = applicationEventPublisher;
    }

    public void publishAppointmentBooked(Long appointmentId, Long patientId, Long patientUserId,
                                         Long doctorId, Long doctorUserId,
                                         java.time.LocalDateTime startTime, java.time.LocalDateTime endTime) {
        String eventId = UUID.randomUUID().toString();
        AppointmentBookedEvent event = new AppointmentBookedEvent(
                eventId, appointmentId, patientId, patientUserId, doctorId, doctorUserId, startTime, endTime
        );

        logger.info("Publishing AppointmentBookedEvent: id={}, appointmentId={}", eventId, appointmentId);

        if (kafkaEnabled && kafkaTemplate != null) {
            try {
                kafkaTemplate.send(topicName, String.valueOf(appointmentId), event)
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                logger.error("Failed to publish to Kafka topic {}: {}. Falling back to internal publisher.", topicName, ex.getMessage());
                                applicationEventPublisher.publishEvent(event);
                            } else {
                                logger.info("Successfully delivered event to Kafka topic {} partition {}", topicName, result.getRecordMetadata().partition());
                            }
                        });
            } catch (Exception e) {
                logger.warn("Kafka publish attempt threw exception: {}. Dispatching via internal event bus.", e.getMessage());
                applicationEventPublisher.publishEvent(event);
            }
        } else {
            logger.info("Kafka is disabled or template not configured. Dispatching via internal application event bus.");
            applicationEventPublisher.publishEvent(event);
        }
    }
}
