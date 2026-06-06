package com.example.backend.security;

import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class AuthTokenUtil {

    public String generateToken() {
        return UUID.randomUUID().toString();
    }
}
