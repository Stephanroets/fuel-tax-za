package com.vehicleexpense.api.enums;

/**
 * Maintenance Item Type Enum - Matches PostgreSQL maintenance_item_type type
 * DIY items bought at shop
 */
public enum MaintenanceItemType {
    ANTIFREEZE("Antifreeze/Coolant"),
    OIL("Engine Oil"),
    WIPER_BLADES("Wiper Blades"),
    LIGHT_BULBS("Light Bulbs"),
    VEHICLE_WASH("Car Wash"),
    VALET("Valet/Detailing");
    
    private final String displayName;
    
    MaintenanceItemType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    public String getDefaultUnit() {
        return switch (this) {
            case ANTIFREEZE, OIL -> "liters";
            case WIPER_BLADES -> "pair";
            case LIGHT_BULBS -> "units";
            case VEHICLE_WASH, VALET -> "service";
        };
    }
}
