package com.vehicleexpense.api.dto;

import com.vehicleexpense.api.enums.FuelType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddVehicleRequest(

    String nickname,

    @NotBlank(message = "Registration number is required")
    String registrationNumber,

    @NotBlank(message = "Make is required")
    String make,

    @NotBlank(message = "Model is required")
    String model,

    @NotNull(message = "Year is required")
    @Min(value = 1980, message = "Year must be 1980 or later")
    @Max(value = 2030, message = "Year must be 2030 or earlier")
    Integer year,

    @NotNull(message = "Fuel type is required")
    FuelType fuelType,

    String color

) {}
