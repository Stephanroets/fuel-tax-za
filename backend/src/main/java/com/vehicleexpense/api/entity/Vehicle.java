package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vehicleexpense.api.enums.FuelType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Vehicle Entity - Fleet vehicle linked to organization
 *
 * Relationship Design:
 * - OWNING side: Vehicle.organization, Vehicle.assignedDriver
 * - INVERSE side: Vehicle.expenses, Vehicle.trips, Vehicle.odometerVerifications
 */
@Entity
@Table(
    name = "vehicles",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_vehicle_registration_org",
        columnNames = { "organization_id", "registration_number" }
    ),
    indexes = {
        @Index(name = "idx_vehicle_org", columnList = "organization_id"),
        @Index(name = "idx_vehicle_driver", columnList = "assigned_driver_id"),
        @Index(
            name = "idx_vehicle_registration",
            columnList = "registration_number"
        ),
        @Index(name = "idx_vehicle_active", columnList = "is_active"),
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Many Vehicles belong to one Organization
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "organization_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_vehicle_organization")
    )
    @JsonBackReference("organization-vehicles")
    private Organization organization;

    /**
     * Many Vehicles can be assigned to one User (Driver)
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
        name = "assigned_driver_id",
        foreignKey = @ForeignKey(name = "fk_vehicle_driver")
    )
    @JsonBackReference("user-vehicles")
    private User assignedDriver;

    @Column(length = 100)
    private String nickname;

    @Column(name = "registration_number", nullable = false, length = 20)
    private String registrationNumber;

    @Column(length = 17)
    private String vin;

    @Column(nullable = false, length = 100)
    private String make;

    @Column(nullable = false, length = 100)
    private String model;

    @Column(nullable = false)
    private Integer year;

    @Column(length = 50)
    private String color;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", nullable = false, length = 25)
    @ColumnTransformer(write = "?::fuel_type")
    private FuelType fuelType;

    @Column(name = "tank_capacity_liters", precision = 6, scale = 2)
    private BigDecimal tankCapacityLiters;

    @Column(name = "current_odometer", nullable = false)
    @Builder.Default
    private Integer currentOdometer = 0;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_price", precision = 12, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "license_expiry")
    private LocalDate licenseExpiry;

    @Column(name = "insurance_policy_number", length = 100)
    private String insurancePolicyNumber;

    @Column(name = "tracker_serial", length = 100)
    private String trackerSerial;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    // =========================================================================
    // INVERSE RELATIONSHIPS - Parent side uses @JsonManagedReference
    // =========================================================================

    /**
     * One Vehicle has many Expenses
     * INVERSE side - Expense.vehicle is the owning side
     * @JsonManagedReference: Parent side
     */
    @OneToMany(
        mappedBy = "vehicle",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL
    )
    @JsonManagedReference("vehicle-expenses")
    @JsonIgnoreProperties({"vehicle", "organization", "user"})
    @Builder.Default
    private List<Expense> expenses = new ArrayList<>();

    /**
     * One Vehicle has many Trips
     * INVERSE side - Trip.vehicle is the owning side
     * @JsonManagedReference: Parent side
     */
    @OneToMany(
        mappedBy = "vehicle",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL
    )
    @JsonManagedReference("vehicle-trips")
    @Builder.Default
    private List<Trip> trips = new ArrayList<>();

    /**
     * One Vehicle has many OdometerVerifications
     * INVERSE side - OdometerVerification.vehicle is the owning side
     * @JsonManagedReference: Parent side
     */
    @OneToMany(
        mappedBy = "vehicle",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL
    )
    @JsonManagedReference("vehicle-verifications")
    @Builder.Default
    private List<OdometerVerification> odometerVerifications =
        new ArrayList<>();

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    public String getDisplayName() {
        return (
            year + " " + make + " " + model + " (" + registrationNumber + ")"
        );
    }

    public UUID getOrganizationId() {
        return organization != null ? organization.getId() : null;
    }

    public UUID getAssignedDriverId() {
        return assignedDriver != null ? assignedDriver.getId() : null;
    }

    /**
     * Update odometer - only allows increases (prevents rollback fraud)
     */
    public void updateOdometer(Integer newReading) {
        if (newReading != null && newReading > this.currentOdometer) {
            this.currentOdometer = newReading;
        }
    }
}
