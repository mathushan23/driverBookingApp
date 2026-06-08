package com.example.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record DriverStatusRequest(
        @NotBlank(message = "Driver status is required")
        @Pattern(regexp = "AVAILABLE|BUSY|OFFLINE", message = "Driver status must be AVAILABLE, BUSY, or OFFLINE")
        String status
) {
}
