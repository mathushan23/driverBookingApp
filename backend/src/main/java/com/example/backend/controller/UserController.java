package com.example.backend.controller;

import com.example.backend.model.AuthResponse;
import com.example.backend.model.DriverStatusRequest;
import com.example.backend.model.LocationRequest;
import com.example.backend.model.OnboardingRequest;
import com.example.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PatchMapping("/{userId}/onboarding")
    public AuthResponse completeOnboarding(
            @PathVariable Long userId,
            @Valid @RequestBody OnboardingRequest request
    ) {
        return userService.completeOnboarding(userId, request);
    }

    @PatchMapping("/{userId}/driver-location")
    public AuthResponse updateDriverLocation(
            @PathVariable Long userId,
            @Valid @RequestBody LocationRequest request
    ) {
        return userService.updateDriverLocation(userId, request);
    }

    @PatchMapping("/{userId}/driver-status")
    public AuthResponse updateDriverStatus(
            @PathVariable Long userId,
            @Valid @RequestBody DriverStatusRequest request
    ) {
        return userService.updateDriverStatus(userId, request);
    }
}
