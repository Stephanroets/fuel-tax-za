package com.vehicleexpense.api.security;

import com.vehicleexpense.api.enums.OrganizationMode;
import com.vehicleexpense.api.enums.UserRole;

import java.util.UUID;

/**
 * JWT Claims Data Transfer Object
 * Encapsulates the claims extracted from a JWT token.
 */
public record JwtClaims(
    UUID userId,
    String email,
    UUID organizationId,
    UserRole role,
    OrganizationMode mode
) {}
