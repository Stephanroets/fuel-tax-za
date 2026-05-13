package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FuelLog Entity - Detailed fuel purchase tracking
 * 
 * South African specific:
 * - Diesel: 10ppm (Ultra Low Sulphur), 50ppm, 500ppm
 * - Petrol: Unleaded 93, Unleaded 95
 * - Prices regulated by Department of Energy
 * - Efficiency measured in km/L (not mpg)
 */
@Entity
@Table(name = "fuel_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FuelLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 25)
    private FuelType fuelType;
    
    @Column(nullable = false, precision = 8, scale = 3)
    private BigDecimal liters;
    
    @Column(name = "price_per_liter", nullable = false, precision = 8, scale = 4)
    private BigDecimal pricePerLiter;
    
    @Column(name = "full_tank", nullable = false)
    @Builder.Default
    private Boolean fullTank = true;
    
    @Column(name = "station_name", length = 255)
    private String stationName;
    
    @Column(name = "station_location", length = 255)
    private String stationLocation;
    
    @Column(name = "previous_odometer")
    private Integer previousOdometer;
    
    @Column(name = "km_since_last_fill", precision = 10, scale = 2)
    private BigDecimal kmSinceLastFill;
    
    @Column(name = "efficiency_km_per_liter", precision = 6, scale = 2)
    private BigDecimal efficiencyKmPerLiter;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Helper methods
    
    /**
     * Calculate fuel efficiency (km/L)
     * Only valid for full tank fills with previous odometer reading
     */
    public void calculateEfficiency(Integer currentOdometer) {
        if (fullTank && previousOdometer != null && currentOdometer != null 
            && liters != null && liters.compareTo(BigDecimal.ZERO) > 0) {
            
            int kmDriven = currentOdometer - previousOdometer;
            if (kmDriven > 0) {
                this.kmSinceLastFill = BigDecimal.valueOf(kmDriven);
                this.efficiencyKmPerLiter = this.kmSinceLastFill
                    .divide(this.liters, 2, RoundingMode.HALF_UP);
            }
        }
    }
    
    /**
     * Get total fuel cost (already stored in parent expense.amountZar)
     */
    public BigDecimal getTotalCost() {
        if (liters != null && pricePerLiter != null) {
            return liters.multiply(pricePerLiter).setScale(2, RoundingMode.HALF_UP);
        }
        return BigDecimal.ZERO;
    }
    
    /**
     * Get efficiency display string
     */
    public String getEfficiencyDisplay() {
        if (efficiencyKmPerLiter != null) {
            return efficiencyKmPerLiter.setScale(1, RoundingMode.HALF_UP) + " km/L";
        }
        return "N/A";
    }
    
    /**
     * Check if this is diesel fuel
     */
    public boolean isDiesel() {
        return fuelType == FuelType.DIESEL_10PPM 
            || fuelType == FuelType.DIESEL_50PPM 
            || fuelType == FuelType.DIESEL_500PPM;
    }
    
    /**
     * Check if this is petrol fuel
     */
    public boolean isPetrol() {
        return fuelType == FuelType.PETROL_UNLEADED_93 
            || fuelType == FuelType.PETROL_UNLEADED_95;
    }
}
