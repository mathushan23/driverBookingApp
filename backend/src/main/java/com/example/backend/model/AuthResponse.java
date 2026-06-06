package com.example.backend.model;

public record AuthResponse(
        Long id,
        String name,
        String email,
        String role,
        boolean onboardingComplete,
        String mobile,
        String nic,
        String phone,
        String vehicleType,
        String vehicleNumber,
        String token
) {
}
