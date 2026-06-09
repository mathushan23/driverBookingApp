package com.example.backend.controller;

import com.example.backend.model.BookingRequest;
import com.example.backend.model.BookingResponse;
import com.example.backend.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    @GetMapping("/{bookingId}")
    public BookingResponse getBooking(@PathVariable Long bookingId) {
        return bookingService.getBooking(bookingId);
    }

    @GetMapping("/rider-history/{riderId}")
    public List<BookingResponse> getRiderHistory(@PathVariable Long riderId) {
        return bookingService.getRiderHistory(riderId);
    }

    @GetMapping("/driver-history/{driverId}")
    public List<BookingResponse> getDriverHistory(@PathVariable Long driverId) {
        return bookingService.getDriverHistory(driverId);
    }

    @GetMapping("/driver-requests/{driverId}")
    public List<BookingResponse> getNearbyPendingRequests(@PathVariable Long driverId) {
        return bookingService.getNearbyPendingRequests(driverId);
    }

    @PatchMapping("/{bookingId}/accept")
    public BookingResponse acceptBooking(@PathVariable Long bookingId, @RequestParam Long driverId) {
        return bookingService.acceptBooking(bookingId, driverId);
    }

    @PatchMapping("/{bookingId}/cancel")
    public BookingResponse cancelBooking(@PathVariable Long bookingId, @RequestParam Long riderId) {
        return bookingService.cancelBooking(bookingId, riderId);
    }

    @PatchMapping("/{bookingId}/complete")
    public BookingResponse completeBooking(@PathVariable Long bookingId, @RequestParam Long driverId) {
        return bookingService.completeBooking(bookingId, driverId);
    }

    @PatchMapping("/{bookingId}/driver-status")
    public BookingResponse updateDriverRideStatus(@PathVariable Long bookingId, @RequestParam Long driverId, @RequestParam String status) {
        return bookingService.updateDriverRideStatus(bookingId, driverId, status);
    }
}
