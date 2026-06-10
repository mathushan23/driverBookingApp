package com.example.backend.controller;

import com.example.backend.model.AdminDriverApprovalRequest;
import com.example.backend.model.AdminDriverStatusRequest;
import com.example.backend.model.AdminUserResponse;
import com.example.backend.model.BookingResponse;
import com.example.backend.model.UserAccount;
import com.example.backend.security.AuthenticatedUserService;
import com.example.backend.service.AdminService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final AuthenticatedUserService authenticatedUsers;

    public AdminController(AdminService adminService, AuthenticatedUserService authenticatedUsers) {
        this.adminService = adminService;
        this.authenticatedUsers = authenticatedUsers;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getUsers(
            @RequestParam(required = false) String role,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireAdmin(authorization);
        return adminService.getUsers(role);
    }

    @GetMapping("/bookings")
    public List<BookingResponse> getBookings(
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireAdmin(authorization);
        return adminService.getBookings();
    }

    @PatchMapping("/drivers/{driverId}/status")
    public AdminUserResponse updateDriverStatus(
            @PathVariable Long driverId,
            @Valid @RequestBody AdminDriverStatusRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireAdmin(authorization);
        return adminService.updateDriverStatus(driverId, request.status());
    }

    @PatchMapping("/drivers/{driverId}/approval")
    public AdminUserResponse updateDriverApproval(
            @PathVariable Long driverId,
            @Valid @RequestBody AdminDriverApprovalRequest request,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireAdmin(authorization);
        return adminService.updateDriverApproval(driverId, request.approved());
    }

    @PatchMapping("/bookings/{bookingId}/cancel")
    public BookingResponse cancelBooking(
            @PathVariable Long bookingId,
            @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        requireAdmin(authorization);
        return adminService.cancelBooking(bookingId);
    }

    private void requireAdmin(String authorization) {
        UserAccount user = authenticatedUsers.requireUser(authorization);
        authenticatedUsers.requireRole(user, "admin");
    }
}
