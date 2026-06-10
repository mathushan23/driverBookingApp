package com.example.backend.controller;

import com.example.backend.model.BookingRequest;
import com.example.backend.model.BookingResponse;
import com.example.backend.model.UserAccount;
import com.example.backend.security.AuthenticatedUserService;
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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final AuthenticatedUserService authenticatedUsers;

    public BookingController(BookingService bookingService, AuthenticatedUserService authenticatedUsers) {
        this.bookingService = bookingService;
        this.authenticatedUsers = authenticatedUsers;
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "rider");
        authenticatedUsers.requireSameUser(user, request.riderId());
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request));
    }

    @GetMapping("/{bookingId}")
    public BookingResponse getBooking(
            @PathVariable Long bookingId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        BookingResponse booking = bookingService.getBooking(bookingId);
        requireBookingAccess(user, booking);
        return booking;
    }

    @GetMapping("/rider-history/{riderId}")
    public List<BookingResponse> getRiderHistory(
            @PathVariable Long riderId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireSameUser(user, riderId);
        return bookingService.getRiderHistory(riderId);
    }

    @GetMapping("/driver-history/{driverId}")
    public List<BookingResponse> getDriverHistory(
            @PathVariable Long driverId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "driver");
        authenticatedUsers.requireSameUser(user, driverId);
        return bookingService.getDriverHistory(driverId);
    }

    @GetMapping("/driver-requests/{driverId}")
    public List<BookingResponse> getNearbyPendingRequests(
            @PathVariable Long driverId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "driver");
        authenticatedUsers.requireSameUser(user, driverId);
        return bookingService.getNearbyPendingRequests(driverId);
    }

    @PatchMapping("/{bookingId}/accept")
    public BookingResponse acceptBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long driverId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "driver");
        if (driverId != null) {
            authenticatedUsers.requireSameUser(user, driverId);
        }
        return bookingService.acceptBooking(bookingId, user.getId());
    }

    @PatchMapping("/{bookingId}/cancel")
    public BookingResponse cancelBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long riderId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "rider");
        if (riderId != null) {
            authenticatedUsers.requireSameUser(user, riderId);
        }
        return bookingService.cancelBooking(bookingId, user.getId());
    }

    @PatchMapping("/{bookingId}/complete")
    public BookingResponse completeBooking(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long driverId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "driver");
        if (driverId != null) {
            authenticatedUsers.requireSameUser(user, driverId);
        }
        return bookingService.completeBooking(bookingId, user.getId());
    }

    @PatchMapping("/{bookingId}/driver-status")
    public BookingResponse updateDriverRideStatus(
            @PathVariable Long bookingId,
            @RequestParam(required = false) Long driverId,
            @RequestParam String status,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "driver");
        if (driverId != null) {
            authenticatedUsers.requireSameUser(user, driverId);
        }
        return bookingService.updateDriverRideStatus(bookingId, user.getId(), status);
    }

    private void requireBookingAccess(UserAccount user, BookingResponse booking) {
        if ("admin".equals(user.getRole())) {
            return;
        }
        if (booking.riderId().equals(user.getId())) {
            return;
        }
        if (booking.driverId() != null && booking.driverId().equals(user.getId())) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can access only your own bookings");
    }
}
