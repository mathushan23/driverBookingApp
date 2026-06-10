package com.example.backend.repository;

import com.example.backend.model.Booking;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByStatusOrderByCreatedAtDesc(String status);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByRiderIdOrderByCreatedAtDesc(Long riderId);

    List<Booking> findByDriverIdOrderByCreatedAtDesc(Long driverId);

    boolean existsByDriverIdAndStatus(Long driverId, String status);

    boolean existsByDriverIdAndStatusIn(Long driverId, List<String> statuses);
}
