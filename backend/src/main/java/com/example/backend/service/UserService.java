package com.example.backend.service;

import com.example.backend.model.AuthResponse;
import com.example.backend.model.DriverStatusRequest;
import com.example.backend.model.LocationRequest;
import com.example.backend.model.OnboardingRequest;
import com.example.backend.model.UserAccount;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserAccountRepository users;
    private final BookingRepository bookings;
    private final AuthService authService;

    public UserService(UserAccountRepository users, BookingRepository bookings, AuthService authService) {
        this.users = users;
        this.bookings = bookings;
        this.authService = authService;
    }

    public AuthResponse completeOnboarding(Long userId, OnboardingRequest request) {
        UserAccount user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setRole(request.role());
        user.setMobile(trimToNull(request.mobile()));
        user.setNic(trimToNull(request.nic()));
        user.setPhone(trimToNull(request.phone()));
        user.setVehicleType(normalizeVehicleType(request.vehicleType()));
        user.setVehicleNumber(trimToNull(request.vehicleNumber()));
        user.setOnboardingComplete(true);

        return authService.toResponse(users.save(user));
    }

    public AuthResponse updateDriverLocation(Long userId, LocationRequest request) {
        UserAccount user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!"driver".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers can update driver location");
        }

        user.setLatitude(request.latitude());
        user.setLongitude(request.longitude());
        user.setAddress(request.address().trim());

        return authService.toResponse(users.save(user));
    }

    public AuthResponse updateDriverStatus(Long userId, DriverStatusRequest request) {
        UserAccount user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!"driver".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers can update driver status");
        }

        boolean hasActiveRide = bookings.existsByDriverIdAndStatus(userId, "ACCEPTED");
        if (hasActiveRide && !"BUSY".equals(request.status())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Complete the active ride before changing driver status");
        }

        user.setDriverStatus(request.status());
        return authService.toResponse(users.save(user));
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeVehicleType(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }

        normalized = normalized.toLowerCase().replace("-", " ").replace("_", " ").trim();
        normalized = normalized.replaceAll("\\s+", " ");

        if (normalized.equals("motorbike") || normalized.equals("moterbike") || normalized.equals("bike")) {
            return "motor bike";
        }
        if (normalized.equals("threewheeler") || normalized.equals("three wheller") || normalized.equals("tuk") || normalized.equals("tuk tuk")) {
            return "three wheeler";
        }
        if (normalized.equals("car")) {
            return "car";
        }
        if (normalized.equals("van")) {
            return "van";
        }

        return normalized;
    }
}
