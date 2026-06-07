package com.example.backend.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BookingRequest(
        @NotNull(message = "Rider id is required")
        Long riderId,

        @NotNull(message = "Pickup latitude is required")
        Double pickupLatitude,

        @NotNull(message = "Pickup longitude is required")
        Double pickupLongitude,

        @NotBlank(message = "Pickup address is required")
        String pickupAddress,

        @NotNull(message = "Drop latitude is required")
        Double dropLatitude,

        @NotNull(message = "Drop longitude is required")
        Double dropLongitude,

        @NotBlank(message = "Drop address is required")
        String dropAddress,

        @NotBlank(message = "Ride type is required")
        String rideType,

        String specialNote
) {
}
