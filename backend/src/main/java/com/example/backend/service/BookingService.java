package com.example.backend.service;

import com.example.backend.model.Booking;
import com.example.backend.model.BookingRequest;
import com.example.backend.model.BookingResponse;
import com.example.backend.model.UserAccount;
import com.example.backend.repository.BookingRepository;
import com.example.backend.repository.UserAccountRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {

    private static final double DRIVER_MATCH_RADIUS_KM = 5.0;
    private static final double PRICE_PER_KM = 100.0;

    private final BookingRepository bookings;
    private final UserAccountRepository users;

    public BookingService(BookingRepository bookings, UserAccountRepository users) {
        this.bookings = bookings;
        this.users = users;
    }

    public BookingResponse createBooking(BookingRequest request) {
        Booking booking = new Booking();
        booking.setRiderId(request.riderId());
        booking.setPickupLatitude(request.pickupLatitude());
        booking.setPickupLongitude(request.pickupLongitude());
        booking.setPickupAddress(request.pickupAddress().trim());
        booking.setDropLatitude(request.dropLatitude());
        booking.setDropLongitude(request.dropLongitude());
        booking.setDropAddress(request.dropAddress().trim());
        booking.setRideType(normalizeVehicleType(request.rideType()));
        double distanceKm = request.distanceKm() == null
                ? distanceKm(request.pickupLatitude(), request.pickupLongitude(), request.dropLatitude(), request.dropLongitude())
                : request.distanceKm();
        booking.setDistanceKm(roundOneDecimal(distanceKm));
        booking.setPrice(roundTwoDecimals(booking.getDistanceKm() * PRICE_PER_KM));
        booking.setSpecialNote(trimToNull(request.specialNote()));
        return toResponse(bookings.save(booking));
    }

    public BookingResponse getBooking(Long bookingId) {
        return toResponse(findBooking(bookingId));
    }

    public List<BookingResponse> getRiderHistory(Long riderId) {
        return bookings.findByRiderIdOrderByCreatedAtDesc(riderId)
                .stream()
                .map(this::toResponse)
                .sorted(this::activeFirst)
                .toList();
    }

    public List<BookingResponse> getDriverHistory(Long driverId) {
        return bookings.findByDriverIdOrderByCreatedAtDesc(driverId)
                .stream()
                .map(this::toResponse)
                .sorted(this::activeFirst)
                .toList();
    }

    public List<BookingResponse> getNearbyPendingRequests(Long driverId) {
        UserAccount driver = users.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        if (!"driver".equals(driver.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers can view ride requests");
        }

        if (driver.getLatitude() == null || driver.getLongitude() == null) {
            return List.of();
        }

        return bookings.findByStatusOrderByCreatedAtDesc("PENDING")
                .stream()
                .filter(booking -> "AVAILABLE".equals(driver.getDriverStatus()))
                .filter(booking -> vehicleMatches(driver, booking))
                .filter(booking -> distanceKm(
                        driver.getLatitude(),
                        driver.getLongitude(),
                        booking.getPickupLatitude(),
                        booking.getPickupLongitude()
                ) <= DRIVER_MATCH_RADIUS_KM)
                .map(this::toResponse)
                .toList();
    }

    public BookingResponse acceptBooking(Long bookingId, Long driverId) {
        Booking booking = findBooking(bookingId);
        UserAccount driver = users.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ride request is no longer pending");
        }

        if (!"driver".equals(driver.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers can accept ride requests");
        }

        if (driver.getLatitude() == null || driver.getLongitude() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Save your current driver location first");
        }

        if (!"AVAILABLE".equals(driver.getDriverStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only AVAILABLE drivers can accept rides");
        }

        if (!vehicleMatches(driver, booking)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This ride requires a matching vehicle type");
        }

        double distance = distanceKm(driver.getLatitude(), driver.getLongitude(), booking.getPickupLatitude(), booking.getPickupLongitude());
        if (distance > DRIVER_MATCH_RADIUS_KM) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers within 5 km of pickup can accept this ride");
        }

        booking.setDriverId(driverId);
        booking.setStatus("ACCEPTED");
        driver.setDriverStatus("BUSY");
        users.save(driver);
        return toResponse(bookings.save(booking));
    }

    public BookingResponse cancelBooking(Long bookingId, Long riderId) {
        Booking booking = findBooking(bookingId);

        if (!booking.getRiderId().equals(riderId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can cancel only your own booking");
        }

        if (!"PENDING".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Booking can be canceled only before a driver accepts");
        }

        booking.setStatus("CANCELED");
        return toResponse(bookings.save(booking));
    }

    public BookingResponse completeBooking(Long bookingId, Long driverId) {
        Booking booking = findBooking(bookingId);
        UserAccount driver = users.findById(driverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Driver not found"));

        if (!driverId.equals(booking.getDriverId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the assigned driver can complete this ride");
        }

        if (!"ACCEPTED".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only accepted rides can be completed");
        }

        booking.setStatus("COMPLETED");
        driver.setDriverStatus("AVAILABLE");
        users.save(driver);
        return toResponse(bookings.save(booking));
    }

    private Booking findBooking(Long bookingId) {
        return bookings.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private BookingResponse toResponse(Booking booking) {
        UserAccount driver = booking.getDriverId() == null
                ? null
                : users.findById(booking.getDriverId()).orElse(null);
        UserAccount rider = users.findById(booking.getRiderId()).orElse(null);

        return new BookingResponse(
                booking.getId(),
                booking.getRiderId(),
                rider == null ? null : rider.getName(),
                rider == null ? null : rider.getMobile(),
                booking.getDriverId(),
                driver == null ? null : driver.getName(),
                driver == null ? null : driver.getPhone(),
                driver == null ? null : driver.getVehicleType(),
                driver == null ? null : driver.getVehicleNumber(),
                driver == null ? null : driver.getLatitude(),
                driver == null ? null : driver.getLongitude(),
                driver == null ? null : driver.getAddress(),
                booking.getPickupLatitude(),
                booking.getPickupLongitude(),
                booking.getPickupAddress(),
                booking.getDropLatitude(),
                booking.getDropLongitude(),
                booking.getDropAddress(),
                booking.getRideType(),
                booking.getDistanceKm(),
                booking.getPrice(),
                booking.getSpecialNote(),
                booking.getStatus(),
                countNearbyDrivers(booking)
        );
    }

    private int activeFirst(BookingResponse left, BookingResponse right) {
        return Integer.compare(statusRank(left.status()), statusRank(right.status()));
    }

    private int statusRank(String status) {
        if ("ACCEPTED".equals(status)) {
            return 0;
        }
        if ("PENDING".equals(status)) {
            return 1;
        }
        if ("COMPLETED".equals(status)) {
            return 2;
        }
        return 3;
    }

    private int countNearbyDrivers(Booking booking) {
        return (int) users.findAll()
                .stream()
                .filter(user -> "driver".equals(user.getRole()))
                .filter(user -> "AVAILABLE".equals(user.getDriverStatus()))
                .filter(user -> vehicleMatches(user, booking))
                .filter(user -> user.getLatitude() != null && user.getLongitude() != null)
                .filter(user -> distanceKm(
                        user.getLatitude(),
                        user.getLongitude(),
                        booking.getPickupLatitude(),
                        booking.getPickupLongitude()
                ) <= DRIVER_MATCH_RADIUS_KM)
                .count();
    }

    private boolean vehicleMatches(UserAccount driver, Booking booking) {
        String driverVehicle = normalizeVehicleType(driver.getVehicleType());
        String requestedVehicle = normalizeVehicleType(booking.getRideType());
        return driverVehicle != null
                && requestedVehicle != null
                && driverVehicle.equals(requestedVehicle);
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double earthRadiusKm = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double rLat1 = Math.toRadians(lat1);
        double rLat2 = Math.toRadians(lat2);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeVehicleType(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }

        normalized = normalized.toLowerCase().replace("-", " ").replace("_", " ").trim();
        normalized = normalized.replaceAll("\\s+", " ");

        if (normalized.equals("motorbike") || normalized.equals("moterbike") || normalized.equals("bike")) {
            return "motor bike";
        }
        if (normalized.equals("threewheeler") || normalized.equals("three wheller") || normalized.equals("tuk") || normalized.equals("tuk tuk")) {
            return "three wheeler";
        }
        if (normalized.equals("car")) {
            return "car";
        }
        if (normalized.equals("van")) {
            return "van";
        }

        return normalized;
    }
}
