package com.vehicleexpense.api.enums;

/**
 * Fuel Type Enum - Matches PostgreSQL fuel_type type
 * South African specific fuel types
 */
public enum FuelType {
    DIESEL_10PPM("Diesel 10ppm (Ultra Low Sulphur)"),
    DIESEL_50PPM("Diesel 50ppm"),
    DIESEL_500PPM("Diesel 500ppm"),
    PETROL_UNLEADED_93("Petrol Unleaded 93"),
    PETROL_UNLEADED_95("Petrol Unleaded 95"),
    ELECTRIC("Electric"),
    HYBRID("Hybrid");

    private final String displayName;

    FuelType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
