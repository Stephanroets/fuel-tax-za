package com.vehicleexpense.api.enums;

/**
 * Trip Purpose Enum - Matches PostgreSQL trip_purpose type
 * For SARS Logbook compliance
 */
public enum TripPurpose {
    BUSINESS("Business/Work"),
    PRIVATE("Private/Leisure");
    
    private final String displayName;
    
    TripPurpose(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
