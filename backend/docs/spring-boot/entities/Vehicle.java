package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Vehicle Entity - Fleet vehicle linked to organization
 * 
 * JPA Relationship Design:
 * - @ManyToOne to Organization: Vehicle belongs to one Organization (owning side)
 * - @ManyToOne to User: Vehicle may be assigned to one Driver (owning side)
 * - @OneToMany(mappedBy) to Expense: Vehicle has many Expenses (inverse side)
 * - @OneToMany(mappedBy) to Trip: Vehicle has many Trips (inverse side)
 * 
 * South African specific:
 * - Registration format: ABC 123 GP (Province codes)
 * - Fuel types: Diesel (10/50/500ppm) and Petrol (93/95)
 */
@Entity
@Table(name = "vehicles",
       uniqueConstraints = @UniqueConstraint(
           name = "uk_vehicle_registration_org",
           columnNames = {"organization_id", "registration_number"}
       ),
       indexes = {
           @Index(name = "idx_vehicle_org", columnList = "organization_id"),
           @Index(name = "idx_vehicle_driver", columnList = "assigned_driver_id"),
           @Index(name = "idx_vehicle_registration", columnList = "registration_number"),
           @Index(name = "idx_vehicle_active", columnList = "is_active")
       })
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
     * This is the OWNING side of the relationship
     * The foreign key (organization_id) is stored in this table
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_vehicle_organization"))
    private Organization organization;
    
    /**
     * Many Vehicles can be assigned to one User (Driver)
     * This is the OWNING side of the relationship
     * The foreign key (assigned_driver_id) is stored in this table
     * Optional - vehicle may not have an assigned driver
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_driver_id",
                foreignKey = @ForeignKey(name = "fk_vehicle_driver"))
    private User assignedDriver;
    
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
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    // =========================================================================
    // INVERSE RELATIONSHIPS (mappedBy = owning side field name)
    // These are NOT the owning side - they do NOT create foreign keys
    // =========================================================================
    
    /**
     * One Vehicle has many Expenses
     * INVERSE side - Expense.vehicle is the owning side
     * mappedBy = "vehicle" refers to Expense.vehicle field
     */
    @OneToMany(mappedBy = "vehicle", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Expense> expenses = new HashSet<>();
    
    /**
     * One Vehicle has many Trips
     * INVERSE side - Trip.vehicle is the owning side
     * mappedBy = "vehicle" refers to Trip.vehicle field
     */
    @OneToMany(mappedBy = "vehicle", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Trip> trips = new HashSet<>();
    
    /**
     * One Vehicle has many OdometerVerifications
     * INVERSE side - OdometerVerification.vehicle is the owning side
     * mappedBy = "vehicle" refers to OdometerVerification.vehicle field
     */
    @OneToMany(mappedBy = "vehicle", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<OdometerVerification> odometerVerifications = new HashSet<>();
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    
    public String getDisplayName() {
        return year + " " + make + " " + model + " (" + registrationNumber + ")";
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
    
    /**
     * Assign a driver to this vehicle (bidirectional sync)
     */
    public void assignDriver(User driver) {
        // Remove from previous driver's assigned vehicles
        if (this.assignedDriver != null) {
            this.assignedDriver.getAssignedVehicles().remove(this);
        }
        this.assignedDriver = driver;
        if (driver != null) {
            driver.getAssignedVehicles().add(this);
        }
    }
    
    /**
     * Unassign the current driver
     */
    public void unassignDriver() {
        assignDriver(null);
    }
    
    /**
     * Add an expense to this vehicle (bidirectional sync)
     */
    public void addExpense(Expense expense) {
        expenses.add(expense);
        expense.setVehicle(this);
    }
    
    /**
     * Add a trip to this vehicle (bidirectional sync)
     */
    public void addTrip(Trip trip) {
        trips.add(trip);
        trip.setVehicle(this);
    }
}

/**
 * Fuel Type Enum - South African specific
 */
enum FuelType {
    DIESEL_10PPM("Diesel 10ppm (Ultra Low Sulphur)"),
    DIESEL_50PPM("Diesel 50ppm"),
    DIESEL_500PPM("Diesel 500ppm"),
    PETROL_UNLEADED_93("Petrol Unleaded 93"),
    PETROL_UNLEADED_95("Petrol Unleaded 95");
    
    private final String displayName;
    
    FuelType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
