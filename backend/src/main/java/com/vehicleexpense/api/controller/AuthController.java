package com.vehicleexpense.api.controller;

import com.vehicleexpense.api.dto.AuthResponse;
import com.vehicleexpense.api.dto.LoginRequest;
import com.vehicleexpense.api.dto.RegisterRequest;
import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication Controller
 * Base path: /api/v1/auth  (listed in SecurityConfig PUBLIC_ENDPOINTS — no JWT required)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/v1/auth/login
     *
     * Request body : { "email": "...", "password": "..." }
     * Success (200): AuthResponse JSON  — accessToken, role, organizationMode, etc.
     * Failure (401): { "message": "..." }
     */
    /**
     * POST /api/v1/auth/register
     *
     * Request body : { email, password, firstName, lastName, organizationName, organizationMode }
     * Success (201): AuthResponse JSON — auto-logged in, token ready to use immediately
     * Failure (409): email already exists
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(
        @Valid @RequestBody RegisterRequest request
    ) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            // Duplicate email
            return ResponseEntity.status(409).body(
                Map.of("message", e.getMessage())
            );
        } catch (Exception e) {
            log.error(
                "Unexpected registration error for {}: {}",
                request.email(),
                e.getMessage(),
                e
            );
            return ResponseEntity.status(500).body(
                Map.of(
                    "message",
                    "An unexpected error occurred. Check backend logs."
                )
            );
        }
    }

    /**
     * POST /api/v1/auth/login
     *
     * Request body : { "email": "...", "password": "..." }
     * Success (200): AuthResponse JSON  — accessToken, role, organizationMode, etc.
     * Failure (401): { "message": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            // Wrong password or unknown email
            return ResponseEntity.status(401).body(
                Map.of("message", "Invalid email or password")
            );
        } catch (DisabledException e) {
            // emailVerified = false  →  check your DB seed: UPDATE users SET email_verified = true WHERE email = 'admin@example.com';
            return ResponseEntity.status(401).body(
                Map.of(
                    "message",
                    "Email not verified. Run the seed fix query and try again."
                )
            );
        } catch (LockedException e) {
            // isActive = false
            return ResponseEntity.status(401).body(
                Map.of(
                    "message",
                    "Account is deactivated. Contact your administrator."
                )
            );
        } catch (Exception e) {
            log.error(
                "Unexpected login error for {}: {}",
                request.email(),
                e.getMessage(),
                e
            );
            return ResponseEntity.status(500).body(
                Map.of(
                    "message",
                    "An unexpected error occurred. Check backend logs."
                )
            );
        }
    }

    /**
     * GET /api/v1/auth/me
     *
     * Returns current authenticated user profile
     * Requires valid JWT token
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(
                Map.of("message", "Not authenticated")
            );
        }

        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "email", user.getEmail(),
            "firstName", user.getFirstName(),
            "lastName", user.getLastName(),
            "role", user.getRole(),
            "organizationId", user.getOrganizationId(),
            "emailVerified", user.getEmailVerified()
        ));
    }
}
