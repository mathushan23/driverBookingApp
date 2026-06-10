package com.example.backend.service;

import com.example.backend.model.AuthResponse;
import com.example.backend.model.LoginRequest;
import com.example.backend.model.SignupRequest;
import com.example.backend.model.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import com.example.backend.security.AuthTokenUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserAccountRepository users;
    private final PasswordEncoder passwordEncoder;
    private final AuthTokenUtil authTokenUtil;

    public AuthService(UserAccountRepository users, PasswordEncoder passwordEncoder, AuthTokenUtil authTokenUtil) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.authTokenUtil = authTokenUtil;
    }

    public AuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        }

        UserAccount user = new UserAccount();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));

        return issueToken(users.save(user));
    }

    public AuthResponse login(LoginRequest request) {
        UserAccount user = users.findByEmailIgnoreCase(normalizeEmail(request.email()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        return issueToken(user);
    }

    public AuthResponse toResponse(UserAccount user) {
        if (user.getAuthToken() == null || user.getAuthToken().isBlank()) {
            user.setAuthToken(authTokenUtil.generateToken());
            user = users.save(user);
        }

        return new AuthResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isOnboardingComplete(),
                user.getMobile(),
                user.getNic(),
                user.getPhone(),
                user.getVehicleType(),
                user.getVehicleNumber(),
                user.getLatitude(),
                user.getLongitude(),
                user.getAddress(),
                user.getDriverStatus(),
                user.isDriverApproved(),
                user.getAuthToken()
        );
    }

    private AuthResponse issueToken(UserAccount user) {
        user.setAuthToken(authTokenUtil.generateToken());
        return toResponse(users.save(user));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }
}
