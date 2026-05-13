package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tire Entity - Standalone tyre tracking
 * 
 * Why standalone (not in parts/maintenance)?
 * - Tyres are high-value items that need separate tracking
 * - Track purchase mileage for warranty claims
 * - Monitor rotation intervals
 * - Calculate cost-per-km for budgeting
 * 
 * South African note: "Tyre" spelling used in display, 
 * but "Tire" in code for consistency with common programming conventions
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
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
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
    
    /**
     * Get full tyre specification display
     * e.g., "Bridgestone Turanza T005 205/55R16 x4"
     */
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
    
    /**
     * Check if rotation is due based on current odometer
     */
    public boolean isRotationDue(Integer currentOdometer) {
        if (currentOdometer == null || rotationIntervalKm == null) {
            return false;
        }
        
        int lastRotation = lastRotationOdometer != null 
            ? lastRotationOdometer 
            : purchaseOdometer;
        
        return (currentOdometer - lastRotation) >= rotationIntervalKm;
    }
    
    /**
     * Get km until next rotation
     */
    public Integer getKmUntilRotation(Integer currentOdometer) {
        if (currentOdometer == null || rotationIntervalKm == null) {
            return null;
        }
        
        int lastRotation = lastRotationOdometer != null 
            ? lastRotationOdometer 
            : purchaseOdometer;
        
        int kmSinceLastRotation = currentOdometer - lastRotation;
        return Math.max(0, rotationIntervalKm - kmSinceLastRotation);
    }
    
    /**
     * Get km driven on these tyres
     */
    public Integer getKmDriven(Integer currentOdometer) {
        if (currentOdometer == null) {
            return null;
        }
        return currentOdometer - purchaseOdometer;
    }
    
    /**
     * Get estimated remaining km based on expected lifespan
     */
    public Integer getEstimatedRemainingKm(Integer currentOdometer) {
        if (expectedLifespanKm == null || currentOdometer == null) {
            return null;
        }
        Integer driven = getKmDriven(currentOdometer);
        if (driven == null) {
            return expectedLifespanKm;
        }
        return Math.max(0, expectedLifespanKm - driven);
    }
    
    /**
     * Check if tyres are still under warranty
     */
    public boolean isUnderWarranty(Integer currentOdometer) {
        if (warrantyKm == null || currentOdometer == null) {
            return false;
        }
        Integer driven = getKmDriven(currentOdometer);
        return driven != null && driven < warrantyKm;
    }
    
    /**
     * Record a rotation event
     */
    public void recordRotation(Integer odometerAtRotation) {
        this.lastRotationOdometer = odometerAtRotation;
    }
}
