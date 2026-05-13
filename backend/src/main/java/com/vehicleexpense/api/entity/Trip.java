package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.vehicleexpense.api.enums.TripPurpose;
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
    
    /**
     * Many Trips belong to one Organization
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_trip_organization"))
    @JsonBackReference
    private Organization organization;
    
    /**
     * Many Trips belong to one Vehicle
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_trip_vehicle"))
    @JsonBackReference("vehicle-trips")
    private Vehicle vehicle;
    
    /**
     * Many Trips are logged by one User
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_trip_user"))
    @JsonBackReference("user-trips")
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
    
    // Computed column in DB, also calculated here
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
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    
    public BigDecimal getCalculatedDistance() {
        if (endOdometer != null && startOdometer != null) {
            return BigDecimal.valueOf(endOdometer - startOdometer);
        }
        return BigDecimal.ZERO;
    }
    
    public boolean isBusiness() {
        return purpose == TripPurpose.BUSINESS;
    }
    
    public boolean isPrivate() {
        return purpose == TripPurpose.PRIVATE;
    }
    
    public String getTripSummary() {
        return startLocation + " → " + endLocation + " (" + getCalculatedDistance() + " km)";
    }
    
    public BigDecimal getTotalAdditionalCosts() {
        BigDecimal tolls = tollCostsZar != null ? tollCostsZar : BigDecimal.ZERO;
        BigDecimal parking = parkingCostsZar != null ? parkingCostsZar : BigDecimal.ZERO;
        return tolls.add(parking);
    }
    
    public boolean isSarsCompliant() {
        if (!isBusiness()) {
            return true;
        }
        boolean hasClient = customerClientName != null && !customerClientName.trim().isEmpty();
        boolean hasReason = reasonForTrip != null && !reasonForTrip.trim().isEmpty();
        return hasClient || hasReason;
    }
    
    public UUID getOrganizationId() {
        return organization != null ? organization.getId() : null;
    }
    
    public UUID getVehicleId() {
        return vehicle != null ? vehicle.getId() : null;
    }
    
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }
    
    @PostPersist
    @PostUpdate
    public void updateVehicleOdometer() {
        if (endOdometer != null && vehicle != null) {
            vehicle.updateOdometer(endOdometer);
        }
    }
}
