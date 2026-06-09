package com.example.backend.model;

public record NearbyDriverResponse(
        Long id,
        String name,
        String vehicleType,
        Double latitude,
        Double longitude,
        double distanceKm
) {
}
