package com.vehicleexpense.api.dto;

import com.vehicleexpense.api.enums.OrganizationMode;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    String email,

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,

    @NotBlank(message = "First name is required") String firstName,

    @NotBlank(message = "Last name is required") String lastName,

    @NotBlank(message = "Organisation name is required")
    String organizationName,

    @NotNull(message = "Organisation mode is required")
    OrganizationMode organizationMode,

    String phone
) {}
