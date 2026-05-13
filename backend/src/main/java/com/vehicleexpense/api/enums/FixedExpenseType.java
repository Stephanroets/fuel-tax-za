package com.vehicleexpense.api.enums;

/**
 * Fixed Expense Type Enum - Matches PostgreSQL fixed_expense_type type
 * Fixed & Admin expenses for South Africa
 */
public enum FixedExpenseType {
    INSURANCE_PREMIUM("Insurance Premium"),
    VEHICLE_TRACKING("Vehicle Tracking"),
    ETOLL_SANRAL("E-Tolls (SANRAL)"),
    LICENSE_RENEWAL("License Renewal"),
    ROADWORTHY("Roadworthy Certificate"),
    OTHER("Other");
    
    private final String displayName;
    
    FixedExpenseType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
