package com.vehicleexpense.api.dto;

import com.vehicleexpense.api.enums.FuelType;

import java.util.UUID;

public record VehicleResponse(
    UUID id,
    String nickname,
    String registrationNumber,
    String make,
    String model,
    Integer year,
    String color,
    FuelType fuelType,
    String fuelTypeLabel,
    Integer currentOdometer,
    boolean compliant  // true if OPENING odometer exists for current tax year
) {}
