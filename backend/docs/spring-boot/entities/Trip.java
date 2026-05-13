package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Trip Entity - SARS Logbook compliant trip logging
 * 
 * SARS Requirements for Vehicle Logbook:
 * - Date of travel
 * - Opening and closing odometer readings
 * - Kilometers traveled
 * - Business vs Private purpose
 * - Description of business purpose
 * - Name of client/customer visited (for business)
 * 
 * This logbook is required to claim vehicle expenses as tax deductions.
 * Only the business percentage of expenses can be deducted.
 */
@Entity
@Table(name = "trips",
       indexes = {
           @Index(name = "idx_trips_org", columnList = "organization_id"),
           @Index(name = "idx_trips_vehicle", columnList = "vehicle_id"),
           @Index(name = "idx_trips_date", columnList = "trip_date"),
           @Index(name = "idx_trips_purpose", columnList = "purpose")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trip {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(name = "trip_date", nullable = false)
    private LocalDate tripDate;
    
    @Column(name = "start_time")
    private LocalTime startTime;
    
    @Column(name = "end_time")
    private LocalTime endTime;
    
    @Column(name = "start_odometer", nullable = false)
    private Integer startOdometer;
    
    @Column(name = "end_odometer", nullable = false)
    private Integer endOdometer;
    
    // Computed column in DB, but also calculated here
    @Column(name = "distance_km", precision = 10, scale = 2, 
            insertable = false, updatable = false)
    private BigDecimal distanceKm;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TripPurpose purpose;
    
    @Column(name = "start_location", nullable = false, length = 255)
    private String startLocation;
    
    @Column(name = "end_location", nullable = false, length = 255)
    private String endLocation;
    
    @Column(name = "route_description", columnDefinition = "TEXT")
    private String routeDescription;
    
    @Column(name = "customer_client_name", length = 255)
    private String customerClientName;
    
    @Column(name = "reason_for_trip", columnDefinition = "TEXT")
    private String reasonForTrip;
    
    @Column(name = "toll_costs_zar", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal tollCostsZar = BigDecimal.ZERO;
    
    @Column(name = "parking_costs_zar", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal parkingCostsZar = BigDecimal.ZERO;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Helper methods
    
    /**
     * Calculate distance (in case DB computed column not available)
     */
    public BigDecimal getCalculatedDistance() {
        if (endOdometer != null && startOdometer != null) {
            return BigDecimal.valueOf(endOdometer - startOdometer);
        }
        return BigDecimal.ZERO;
    }
    
    /**
     * Check if this is a business trip
     */
    public boolean isBusiness() {
        return purpose == TripPurpose.BUSINESS;
    }
    
    /**
     * Check if this is a private trip
     */
    public boolean isPrivate() {
        return purpose == TripPurpose.PRIVATE;
    }
    
    /**
     * Get trip summary for display
     */
    public String getTripSummary() {
        return startLocation + " → " + endLocation + " (" + getCalculatedDistance() + " km)";
    }
    
    /**
     * Get total additional costs (tolls + parking)
     */
    public BigDecimal getTotalAdditionalCosts() {
        BigDecimal tolls = tollCostsZar != null ? tollCostsZar : BigDecimal.ZERO;
        BigDecimal parking = parkingCostsZar != null ? parkingCostsZar : BigDecimal.ZERO;
        return tolls.add(parking);
    }
    
    /**
     * Validate that this trip is SARS compliant
     * Business trips require customer/client name and reason
     */
    public boolean isSarsCompliant() {
        if (!isBusiness()) {
            return true; // Private trips don't need extra info
        }
        
        // Business trips should have client name and reason
        boolean hasClient = customerClientName != null && !customerClientName.trim().isEmpty();
        boolean hasReason = reasonForTrip != null && !reasonForTrip.trim().isEmpty();
        
        return hasClient || hasReason;
    }
    
    /**
     * Get organization ID from relationship
     */
    public UUID getOrganizationId() {
        return organization != null ? organization.getId() : null;
    }
    
    /**
     * Get vehicle ID from relationship
     */
    public UUID getVehicleId() {
        return vehicle != null ? vehicle.getId() : null;
    }
    
    /**
     * Get user ID from relationship
     */
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }
    
    /**
     * Update vehicle odometer after trip
     */
    @PostPersist
    @PostUpdate
    public void updateVehicleOdometer() {
        if (endOdometer != null && vehicle != null) {
            vehicle.updateOdometer(endOdometer);
        }
    }
}

/**
 * Trip Purpose Enum - For SARS Logbook
 */
enum TripPurpose {
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
