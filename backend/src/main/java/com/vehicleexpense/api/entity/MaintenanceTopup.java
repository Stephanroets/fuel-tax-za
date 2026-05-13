package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.vehicleexpense.api.enums.MaintenanceItemType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MaintenanceTopup Entity - DIY purchases at shop
 * OWNING side of OneToOne with Expense
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
    
    /**
     * One MaintenanceTopup belongs to one Expense
     * OWNING side - @JsonBackReference prevents recursion
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_maintenance_topup_expense"))
    @JsonBackReference
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
    private String itemUnit;
    
    @Column(name = "shop_name", length = 255)
    private String shopName;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Helper methods
    
    public String getQuantityDisplay() {
        if (itemUnit != null && !itemUnit.isEmpty()) {
            return itemQuantity.stripTrailingZeros().toPlainString() + " " + itemUnit;
        }
        return itemQuantity.stripTrailingZeros().toPlainString();
    }
    
    public String getFullDescription() {
        StringBuilder sb = new StringBuilder();
        sb.append(itemType.getDisplayName());
        if (itemBrand != null && !itemBrand.isEmpty()) {
            sb.append(" - ").append(itemBrand);
        }
        return sb.toString();
    }
    
    public boolean isFluidTopup() {
        return itemType == MaintenanceItemType.ANTIFREEZE 
            || itemType == MaintenanceItemType.OIL;
    }
    
    public boolean isWashService() {
        return itemType == MaintenanceItemType.VEHICLE_WASH 
            || itemType == MaintenanceItemType.VALET;
    }
}
