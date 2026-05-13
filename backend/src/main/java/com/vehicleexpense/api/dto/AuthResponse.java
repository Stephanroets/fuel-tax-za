package com.vehicleexpense.api.dto;

import com.vehicleexpense.api.enums.OrganizationMode;
import com.vehicleexpense.api.enums.UserRole;

import java.util.UUID;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UUID userId,
    String email,
    String firstName,
    String lastName,
    UserRole role,
    UUID organizationId,
    String organizationName,
    OrganizationMode organizationMode
) {}
