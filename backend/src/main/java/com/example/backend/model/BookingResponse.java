package com.example.backend.model;

public record BookingResponse(
        Long id,
        Long riderId,
        Long driverId,
        String driverName,
        String driverVehicleType,
        String driverVehicleNumber,
        Double pickupLatitude,
        Double pickupLongitude,
        String pickupAddress,
        Double dropLatitude,
        Double dropLongitude,
        String dropAddress,
        String vehicleType,
        String specialNote,
        String status,
        int nearbyDriverCount
) {
}
