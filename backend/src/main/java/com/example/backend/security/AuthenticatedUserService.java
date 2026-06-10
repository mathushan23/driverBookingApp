package com.example.backend.security;

import com.example.backend.model.UserAccount;
import com.example.backend.repository.UserAccountRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthenticatedUserService {

    private final UserAccountRepository users;

    public AuthenticatedUserService(UserAccountRepository users) {
        this.users = users;
    }

    public UserAccount requireUser(String authorizationHeader) {
        String token = extractBearerToken(authorizationHeader);
        return users.findByAuthToken(token)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token"));
    }

    public void requireSameUser(UserAccount authenticatedUser, Long requestedUserId) {
        if (!authenticatedUser.getId().equals(requestedUserId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can access only your own account");
        }
    }

    public void requireRole(UserAccount authenticatedUser, String role) {
        if (!role.equals(authenticatedUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This action is not allowed for your role");
        }
    }

    private String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization token is required");
        }

        String prefix = "Bearer ";
        if (!authorizationHeader.regionMatches(true, 0, prefix, 0, prefix.length())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization token must use Bearer scheme");
        }

        String token = authorizationHeader.substring(prefix.length()).trim();
        if (token.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authorization token is required");
        }
        return token;
    }
}
