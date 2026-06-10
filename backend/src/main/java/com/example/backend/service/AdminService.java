package com.example.backend.service;

import com.example.backend.model.AdminUserResponse;
import com.example.backend.model.Booking;
import com.example.backend.model.BookingResponse;
import com.example.backend.model.UserAccount;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.UserAccountRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AdminService {

    private final UserAccountRepository users;
    private final BookingRepository bookings;
    private final BookingService bookingService;

    public AdminService(UserAccountRepository users, BookingRepository bookings, BookingService bookingService) {
        this.users = users;
        this.bookings = bookings;
        this.bookingService = bookingService;
    }

    public List<AdminUserResponse> getUsers(String role) {
        String normalizedRole = trimToNull(role);
        return users.findAll()
                .stream()
                .filter(user -> normalizedRole == null || normalizedRole.equalsIgnoreCase(user.getRole()))
                .map(this::toUserResponse)
                .toList();
    }

    public List<BookingResponse> getBookings() {
        return bookings.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(bookingService::toResponse)
                .toList();
    }

    public AdminUserResponse updateDriverStatus(Long driverId, String status) {
        UserAccount driver = users.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        if (!"driver".equals(driver.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers have a driver status");
        }

        if (!driver.isDriverApproved()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Approve this driver before changing availability");
        }

        String normalizedStatus = normalizeDriverStatus(status);
        boolean hasActiveRide = bookings.existsByDriverIdAndStatusIn(driverId, List.of("ACCEPTED", "ON_THE_WAY", "STARTED"));
        if (hasActiveRide && !"BUSY".equals(normalizedStatus)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Driver has an active ride");
        }

        driver.setDriverStatus(normalizedStatus);
        return toUserResponse(users.save(driver));
    }

    public AdminUserResponse updateDriverApproval(Long driverId, boolean approved) {
        UserAccount driver = users.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        if (!"driver".equals(driver.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers require approval");
        }

        driver.setDriverApproved(approved);
        if (!approved) {
            driver.setDriverStatus("OFFLINE");
        }
        return toUserResponse(users.save(driver));
    }

    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookings.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

        if ("COMPLETED".equals(booking.getStatus()) || "CANCELED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active bookings can be canceled");
        }

        if (booking.getDriverId() != null) {
            users.findById(booking.getDriverId()).ifPresent(driver -> {
                driver.setDriverStatus("AVAILABLE");
                users.save(driver);
            });
        }

        booking.setStatus("CANCELED");
        return bookingService.toResponse(bookings.save(booking));
    }

    private AdminUserResponse toUserResponse(UserAccount user) {
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isOnboardingComplete(),
                user.getMobile(),
                user.getNic(),
                user.getPhone(),
                user.getVehicleType(),
                user.getVehicleNumber(),
                user.getLatitude(),
                user.getLongitude(),
                user.getAddress(),
                user.getDriverStatus(),
                user.isDriverApproved()
        );
    }

    private String normalizeDriverStatus(String status) {
        String normalized = trimToNull(status);
        if (normalized == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Driver status is required");
        }

        normalized = normalized.toUpperCase().replace("-", "_").replace(" ", "_");
        if ("AVAILABLE".equals(normalized) || "BUSY".equals(normalized) || "OFFLINE".equals(normalized)) {
            return normalized;
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported driver status");
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
