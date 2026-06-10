package com.example.backend.model;

import jakarta.validation.constraints.NotBlank;

public record AdminDriverStatusRequest(
        @NotBlank(message = "Driver status is required")
        String status
) {
}
