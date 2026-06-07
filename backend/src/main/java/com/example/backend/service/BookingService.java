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
        booking.setRideType(request.rideType().trim());
        booking.setSpecialNote(trimToNull(request.specialNote()));
        return toResponse(bookings.save(booking));
    }

    public BookingResponse getBooking(Long bookingId) {
        return toResponse(findBooking(bookingId));
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

        double distance = distanceKm(driver.getLatitude(), driver.getLongitude(), booking.getPickupLatitude(), booking.getPickupLongitude());
        if (distance > DRIVER_MATCH_RADIUS_KM) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only drivers within 5 km of pickup can accept this ride");
        }

        booking.setDriverId(driverId);
        booking.setStatus("ACCEPTED");
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

    private Booking findBooking(Long bookingId) {
        return bookings.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
    }

    private BookingResponse toResponse(Booking booking) {
        UserAccount driver = booking.getDriverId() == null
                ? null
                : users.findById(booking.getDriverId()).orElse(null);

        return new BookingResponse(
                booking.getId(),
                booking.getRiderId(),
                booking.getDriverId(),
                driver == null ? null : driver.getName(),
                driver == null ? null : driver.getVehicleType(),
                driver == null ? null : driver.getVehicleNumber(),
                booking.getPickupLatitude(),
                booking.getPickupLongitude(),
                booking.getPickupAddress(),
                booking.getDropLatitude(),
                booking.getDropLongitude(),
                booking.getDropAddress(),
                booking.getRideType(),
                booking.getSpecialNote(),
                booking.getStatus(),
                countNearbyDrivers(booking)
        );
    }

    private int countNearbyDrivers(Booking booking) {
        return (int) users.findAll()
                .stream()
                .filter(user -> "driver".equals(user.getRole()))
                .filter(user -> user.getLatitude() != null && user.getLongitude() != null)
                .filter(user -> distanceKm(
                        user.getLatitude(),
                        user.getLongitude(),
                        booking.getPickupLatitude(),
                        booking.getPickupLongitude()
                ) <= DRIVER_MATCH_RADIUS_KM)
                .count();
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
}
