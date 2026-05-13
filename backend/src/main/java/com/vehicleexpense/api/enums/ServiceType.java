package com.vehicleexpense.api.enums;

/**
 * Service Type Enum - Matches PostgreSQL service_type type
 * Workshop service types
 */
public enum ServiceType {
    MAJOR_SERVICE("Major Service"),
    MINOR_SERVICE("Minor Service"),
    BRAKE_OVERHAUL("Brake Overhaul"),
    ENGINE_REPAIR("Engine Repair"),
    TRANSMISSION("Transmission"),
    SUSPENSION("Suspension"),
    ELECTRICAL("Electrical"),
    AIR_CONDITIONING("Air Conditioning"),
    OTHER("Other");
    
    private final String displayName;
    
    ServiceType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
