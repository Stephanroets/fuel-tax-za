package com.vehicleexpense.api.enums;

/**
 * Expense Category Enum - Matches PostgreSQL expense_category type
 * Non-conflicting South African "Recipes"
 */
public enum ExpenseCategory {
    FUEL_LOG("Fuel"),
    MECHANIC_SERVICE("Service & Repairs"),
    MAINTENANCE_TOPUP("Maintenance Top-ups (DIY)"),
    TIRES("Tyres"),
    FIXED_ADMIN("Fixed & Admin"),
    CAR_WASH("Car Wash");
    
    private final String displayName;
    
    ExpenseCategory(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
