package com.example.backend.controller;

import com.example.backend.model.AuthResponse;
import com.example.backend.model.DriverStatusRequest;
import com.example.backend.model.LocationRequest;
import com.example.backend.model.OnboardingRequest;
import com.example.backend.model.UserAccount;
import com.example.backend.security.AuthenticatedUserService;
import com.example.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthenticatedUserService authenticatedUsers;

    public UserController(UserService userService, AuthenticatedUserService authenticatedUsers) {
        this.userService = userService;
        this.authenticatedUsers = authenticatedUsers;
    }

    @GetMapping("/me")
    public AuthResponse getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        return userService.toAuthResponse(user);
    }

    @PatchMapping("/{userId}/onboarding")
    public AuthResponse completeOnboarding(
            @PathVariable Long userId,
            @Valid @RequestBody OnboardingRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireSameUser(user, userId);
        return userService.completeOnboarding(userId, request);
    }

    @PatchMapping("/{userId}/driver-location")
    public AuthResponse updateDriverLocation(
            @PathVariable Long userId,
            @Valid @RequestBody LocationRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "driver");
        authenticatedUsers.requireSameUser(user, userId);
        return userService.updateDriverLocation(userId, request);
    }

    @PatchMapping("/{userId}/driver-status")
    public AuthResponse updateDriverStatus(
            @PathVariable Long userId,
            @Valid @RequestBody DriverStatusRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "driver");
        authenticatedUsers.requireSameUser(user, userId);
        return userService.updateDriverStatus(userId, request);
    }
}
