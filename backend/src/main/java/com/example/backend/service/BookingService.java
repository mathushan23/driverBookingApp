package com.example.backend.service;

import com.example.backend.model.Booking;
import com.example.backend.model.BookingRequest;
import com.example.backend.repository.BookingRepository;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

    private final BookingRepository bookings;

    public BookingService(BookingRepository bookings) {
        this.bookings = bookings;
    }

    public Booking createBooking(BookingRequest request) {
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
        return bookings.save(booking);
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
