package com.example.backend.service;

import com.example.backend.model.AuthResponse;
import com.example.backend.model.OnboardingRequest;
import com.example.backend.model.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserAccountRepository users;
    private final AuthService authService;

    public UserService(UserAccountRepository users, AuthService authService) {
        this.users = users;
        this.authService = authService;
    }

    public AuthResponse completeOnboarding(Long userId, OnboardingRequest request) {
        UserAccount user = users.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setRole(request.role());
        user.setMobile(trimToNull(request.mobile()));
        user.setNic(trimToNull(request.nic()));
        user.setPhone(trimToNull(request.phone()));
        user.setVehicleType(trimToNull(request.vehicleType()));
        user.setVehicleNumber(trimToNull(request.vehicleNumber()));
        user.setOnboardingComplete(true);

        return authService.toResponse(users.save(user));
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
