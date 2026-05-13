package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MaintenanceTopup Entity - DIY purchases at shop
 * 
 * Distinct from MechanicService:
 * - MaintenanceTopup = Individual items bought at shop (DIY)
 * - MechanicService = Full workshop invoice with labor
 * 
 * Items:
 * - Antifreeze/Coolant
 * - Engine Oil
 * - Wiper Blades
 * - Light Bulbs
 * - Vehicle Wash
 * - Valet/Detailing
 */
@Entity
@Table(name = "maintenance_topups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceTopup {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private MaintenanceItemType itemType;
    
    @Column(name = "item_brand", length = 100)
    private String itemBrand;
    
    @Column(name = "item_quantity", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal itemQuantity = BigDecimal.ONE;
    
    @Column(name = "item_unit", length = 20)
    private String itemUnit; // liters, units, pair, etc.
    
    @Column(name = "shop_name", length = 255)
    private String shopName;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Helper methods
    
    /**
     * Get quantity with unit display
     */
    public String getQuantityDisplay() {
        if (itemUnit != null && !itemUnit.isEmpty()) {
            return itemQuantity.stripTrailingZeros().toPlainString() + " " + itemUnit;
        }
        return itemQuantity.stripTrailingZeros().toPlainString();
    }
    
    /**
     * Get full description with brand if available
     */
    public String getFullDescription() {
        StringBuilder sb = new StringBuilder();
        sb.append(itemType.getDisplayName());
        if (itemBrand != null && !itemBrand.isEmpty()) {
            sb.append(" - ").append(itemBrand);
        }
        return sb.toString();
    }
    
    /**
     * Check if this is a fluid top-up (oil, antifreeze)
     */
    public boolean isFluidTopup() {
        return itemType == MaintenanceItemType.ANTIFREEZE 
            || itemType == MaintenanceItemType.OIL;
    }
    
    /**
     * Check if this is a wash/cleaning service
     */
    public boolean isWashService() {
        return itemType == MaintenanceItemType.VEHICLE_WASH 
            || itemType == MaintenanceItemType.VALET;
    }
}

/**
 * Maintenance Item Type Enum
 */
enum MaintenanceItemType {
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
    
    /**
     * Get default unit for this item type
     */
    public String getDefaultUnit() {
        return switch (this) {
            case ANTIFREEZE, OIL -> "liters";
            case WIPER_BLADES -> "pair";
            case LIGHT_BULBS -> "units";
            case VEHICLE_WASH, VALET -> "service";
        };
    }
}
