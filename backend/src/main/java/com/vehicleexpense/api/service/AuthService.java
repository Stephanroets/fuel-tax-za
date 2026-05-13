package com.vehicleexpense.api.service;

import com.vehicleexpense.api.dto.AuthResponse;
import com.vehicleexpense.api.dto.LoginRequest;
import com.vehicleexpense.api.dto.RegisterRequest;
import com.vehicleexpense.api.entity.Organization;
import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.enums.UserRole;
import com.vehicleexpense.api.repository.OrganizationRepository;
import com.vehicleexpense.api.repository.UserRepository;
import com.vehicleexpense.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Authenticate user and return JWT tokens.
     * Spring Security's AuthenticationManager handles password verification,
     * emailVerified (enabled) and isActive (accountNonLocked) checks.
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.email(),
                request.password()
            )
        );

        User user = userRepository
            .findByEmail(request.email())
            .orElseThrow(() ->
                new IllegalStateException(
                    "User vanished after authentication — this should never happen"
                )
            );

        // NOTE: last_login update skipped — the DB column is `timestamptz` but the
        // entity maps it as LocalDateTime (timezone-naive). Fix the entity to use
        // OffsetDateTime before re-enabling.

        log.info(
            "Successful login: {} (role={}, org={})",
            user.getEmail(),
            user.getRole(),
            user.getOrganization().getName()
        );

        return buildAuthResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Register a new organisation + admin user, then auto-login and return JWT.
     * The first user of every organisation is always ADMIN.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Guard: duplicate email
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException(
                "An account with this email already exists"
            );
        }

        // 2. Create organisation
        Organization org = Organization.builder()
            .name(request.organizationName())
            .mode(request.organizationMode())
            .build();
        organizationRepository.save(org);

        // 3. Create user (first user of any org is always ADMIN, email pre-verified in dev)
        User user = User.builder()
            .organization(org)
            .email(request.email())
            .passwordHash(passwordEncoder.encode(request.password()))
            .firstName(request.firstName())
            .lastName(request.lastName())
            .phone(request.phone())
            .role(UserRole.ADMIN)
            .emailVerified(true) // Skip email verification for local dev
            .isActive(true)
            .build();
        userRepository.save(user);

        log.info(
            "New registration: {} (org={}, mode={})",
            user.getEmail(),
            org.getName(),
            org.getMode()
        );

        // 4. Auto-login — return a JWT so the browser is logged in immediately
        return buildAuthResponse(user);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SHARED
    // ─────────────────────────────────────────────────────────────────────────

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(
            user.getId(),
            user.getEmail(),
            user.getOrganizationId(),
            user.getRole(),
            user.getOrganization().getMode()
        );

        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return new AuthResponse(
            accessToken,
            refreshToken,
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            user.getOrganizationId(),
            user.getOrganization().getName(),
            user.getOrganization().getMode()
        );
    }
}
