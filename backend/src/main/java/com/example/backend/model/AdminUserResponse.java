package com.example.backend.model;

public record AdminUserResponse(
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
        Double latitude,
        Double longitude,
        String address,
        String driverStatus,
        boolean driverApproved
) {
}
