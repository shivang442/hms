package com.hospital.hms.event;

import com.hospital.hms.entity.*;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.NotificationRepository;
import com.hospital.hms.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;

@Component
public class AppointmentEventConsumer {

    private static final Logger logger = LoggerFactory.getLogger(AppointmentEventConsumer.class);
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a");

    private final NotificationRepository notificationRepository;
    private final AppointmentRepository appointmentRepository;
    private final UserRepository userRepository;

    @Autowired
    public AppointmentEventConsumer(NotificationRepository notificationRepository,
                                    AppointmentRepository appointmentRepository,
                                    UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.appointmentRepository = appointmentRepository;
        this.userRepository = userRepository;
    }

    @KafkaListener(
            topics = "${app.kafka.topics.appointment-events:appointment-events}",
            groupId = "hms-notification-group",
            autoStartup = "${app.kafka.enabled:true}"
    )
    public void consumeKafkaEvent(AppointmentBookedEvent event) {
        logger.info("Kafka consumer received AppointmentBookedEvent: eventId={}, appointmentId={}",
                event.getEventId(), event.getAppointmentId());
        processAppointmentBooked(event);
    }

    @EventListener
    public void handleApplicationEvent(AppointmentBookedEvent event) {
        logger.info("Application event listener processing AppointmentBookedEvent: eventId={}, appointmentId={}",
                event.getEventId(), event.getAppointmentId());
        processAppointmentBooked(event);
    }

    @Transactional
    public void processAppointmentBooked(AppointmentBookedEvent event) {
        Appointment appointment = appointmentRepository.findById(event.getAppointmentId()).orElse(null);
        if (appointment == null) {
            logger.warn("Appointment not found with ID: {}. Skipping notification.", event.getAppointmentId());
            return;
        }

        String formattedTime = appointment.getStartTime().format(FORMATTER);

        // 1. Notify Patient (Idempotent Check)
        if (event.getPatientUserId() != null) {
            boolean alreadyNotified = notificationRepository.existsByUserIdAndAppointmentIdAndNotificationType(
                    event.getPatientUserId(), event.getAppointmentId(), NotificationType.APPOINTMENT_BOOKED
            );

            if (!alreadyNotified) {
                User patientUser = userRepository.findById(event.getPatientUserId()).orElse(null);
                if (patientUser != null) {
                    String patientMsg = String.format("Your appointment with Dr. %s is booked for %s.",
                            appointment.getDoctor().getUser().getFullName(), formattedTime);

                    Notification patientNotification = new Notification(
                            patientUser, appointment, NotificationType.APPOINTMENT_BOOKED, patientMsg
                    );
                    notificationRepository.save(patientNotification);
                    logger.info("Created booking notification for patient user {}", patientUser.getId());
                }
            } else {
                logger.info("Notification for patient user {} already exists. Skipping (idempotent).", event.getPatientUserId());
            }
        }

        // 2. Notify Doctor (Idempotent Check)
        if (event.getDoctorUserId() != null) {
            boolean doctorNotified = notificationRepository.existsByUserIdAndAppointmentIdAndNotificationType(
                    event.getDoctorUserId(), event.getAppointmentId(), NotificationType.APPOINTMENT_BOOKED
            );

            if (!doctorNotified) {
                User doctorUser = userRepository.findById(event.getDoctorUserId()).orElse(null);
                if (doctorUser != null) {
                    String doctorMsg = String.format("New appointment scheduled with patient %s on %s.",
                            appointment.getPatient().getUser().getFullName(), formattedTime);

                    Notification doctorNotification = new Notification(
                            doctorUser, appointment, NotificationType.APPOINTMENT_BOOKED, doctorMsg
                    );
                    notificationRepository.save(doctorNotification);
                    logger.info("Created booking notification for doctor user {}", doctorUser.getId());
                }
            } else {
                logger.info("Notification for doctor user {} already exists. Skipping (idempotent).", event.getDoctorUserId());
            }
        }
    }
}
