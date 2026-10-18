package com.hospital.hms.service;

import com.hospital.hms.dto.common.DashboardStatsDTO;
import com.hospital.hms.entity.AppointmentStatus;
import com.hospital.hms.entity.Role;
import com.hospital.hms.repository.AppointmentRepository;
import com.hospital.hms.repository.DoctorRepository;
import com.hospital.hms.repository.PatientRepository;
import com.hospital.hms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;

    @Autowired
    public AdminDashboardService(UserRepository userRepository,
                                 DoctorRepository doctorRepository,
                                 PatientRepository patientRepository,
                                 AppointmentRepository appointmentRepository) {
        this.userRepository = userRepository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
        this.appointmentRepository = appointmentRepository;
    }

    @Transactional(readOnly = true)
    public DashboardStatsDTO getDashboardStats() {
        long totalPatients = patientRepository.count();
        long totalDoctors = doctorRepository.countByActiveTrue();
        long totalAppointments = appointmentRepository.count();

        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().plusDays(1).atStartOfDay();
        long todayBookings = appointmentRepository.countBookingsToday(startOfToday, endOfToday);

        long pending = appointmentRepository.countByStatus(AppointmentStatus.PENDING);
        long confirmed = appointmentRepository.countByStatus(AppointmentStatus.CONFIRMED);
        long completed = appointmentRepository.countByStatus(AppointmentStatus.COMPLETED);
        long cancelled = appointmentRepository.countByStatus(AppointmentStatus.CANCELLED);

        // Group appointments by specialization for Recharts
        Map<String, Long> specializationStats = new HashMap<>();
        doctorRepository.findAll().forEach(doc -> {
            String spec = doc.getSpecialization();
            long count = appointmentRepository.searchAppointments(null, doc.getId(), null, null, null, org.springframework.data.domain.Pageable.unpaged()).getTotalElements();
            specializationStats.put(spec, specializationStats.getOrDefault(spec, 0L) + count);
        });

        return new DashboardStatsDTO(
                totalPatients,
                totalDoctors,
                totalAppointments,
                todayBookings,
                pending,
                confirmed,
                completed,
                cancelled,
                specializationStats
        );
    }
}
