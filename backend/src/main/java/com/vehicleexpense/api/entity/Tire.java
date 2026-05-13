package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tire Entity - Standalone tyre tracking
 * OWNING side of OneToOne with Expense
 */
@Entity
@Table(name = "tires")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tire {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    /**
     * One Tire record belongs to one Expense
     * OWNING side - @JsonBackReference prevents recursion
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_tire_expense"))
    @JsonBackReference
    private Expense expense;
    
    @Column(nullable = false, length = 100)
    private String brand;
    
    @Column(length = 100)
    private String model;
    
    @Column(nullable = false, length = 50)
    private String size; // e.g., "205/55R16"
    
    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 4;
    
    @Column(length = 50)
    private String position; // "Front", "Rear", "All", "Spare"
    
    @Column(name = "purchase_odometer", nullable = false)
    private Integer purchaseOdometer;
    
    @Column(name = "tread_depth_mm", precision = 4, scale = 2)
    private BigDecimal treadDepthMm;
    
    @Column(name = "expected_lifespan_km")
    private Integer expectedLifespanKm;
    
    @Column(name = "rotation_interval_km")
    @Builder.Default
    private Integer rotationIntervalKm = 10000;
    
    @Column(name = "last_rotation_odometer")
    private Integer lastRotationOdometer;
    
    @Column(name = "warranty_km")
    private Integer warrantyKm;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Helper methods
    
    public String getFullSpecification() {
        StringBuilder sb = new StringBuilder();
        sb.append(brand);
        if (model != null && !model.isEmpty()) {
            sb.append(" ").append(model);
        }
        sb.append(" ").append(size);
        sb.append(" x").append(quantity);
        return sb.toString();
    }
    
    public boolean isRotationDue(Integer currentOdometer) {
        if (currentOdometer == null || rotationIntervalKm == null) {
            return false;
        }
        int lastRotation = lastRotationOdometer != null 
            ? lastRotationOdometer 
            : purchaseOdometer;
        return (currentOdometer - lastRotation) >= rotationIntervalKm;
    }
    
    public Integer getKmDriven(Integer currentOdometer) {
        if (currentOdometer == null) {
            return null;
        }
        return currentOdometer - purchaseOdometer;
    }
    
    public boolean isUnderWarranty(Integer currentOdometer) {
        if (warrantyKm == null || currentOdometer == null) {
            return false;
        }
        Integer driven = getKmDriven(currentOdometer);
        return driven != null && driven < warrantyKm;
    }
    
    public void recordRotation(Integer odometerAtRotation) {
        this.lastRotationOdometer = odometerAtRotation;
    }
}
