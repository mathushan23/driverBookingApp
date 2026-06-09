package com.example.backend.model;

import java.util.List;

public record BookingResponse(
        Long id,
        Long riderId,
        String riderName,
        String riderMobile,
        Long driverId,
        String driverName,
        String driverPhone,
        String driverVehicleType,
        String driverVehicleNumber,
        Double driverLatitude,
        Double driverLongitude,
        String driverAddress,
        Double pickupLatitude,
        Double pickupLongitude,
        String pickupAddress,
        Double dropLatitude,
        Double dropLongitude,
        String dropAddress,
        String vehicleType,
        Double distanceKm,
        Double price,
        String specialNote,
        String status,
        int nearbyDriverCount,
        List<NearbyDriverResponse> nearbyDrivers
) {
}
