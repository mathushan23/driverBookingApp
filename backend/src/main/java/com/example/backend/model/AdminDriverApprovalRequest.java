package com.example.backend.model;

import jakarta.validation.constraints.NotNull;

public record AdminDriverApprovalRequest(
        @NotNull(message = "Approval value is required")
        Boolean approved
) {
}
