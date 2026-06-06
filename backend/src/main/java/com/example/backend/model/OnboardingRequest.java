package com.example.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OnboardingRequest(
        @NotBlank(message = "Role is required")
        @Pattern(regexp = "rider|driver", message = "Role must be rider or driver")
        String role,
        String mobile,
        String nic,
        String phone,
        String vehicleType,
        String vehicleNumber
) {
}
