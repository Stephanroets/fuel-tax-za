package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Organization Entity - Root of multi-tenant hierarchy
 * 
 * JPA Relationship Design:
 * - @OneToMany(mappedBy): Organization has many Users, Vehicles (inverse side)
 * - All child entities (Users, Vehicles) have @ManyToOne back to Organization
 * - This entity does NOT own any relationships - it is always the INVERSE side
 * 
 * Supports two modes:
 * - SOLO: Single user (Doctor/Freelancer managing their own vehicle)
 * - FLEET: Multiple users with role-based access (Admin, Manager, Driver)
 */
@Entity
@Table(name = "organizations",
       indexes = {
           @Index(name = "idx_org_active", columnList = "is_active"),
           @Index(name = "idx_org_mode", columnList = "mode")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private OrganizationMode mode = OrganizationMode.SOLO;
    
    @Column(name = "tax_number", length = 50)
    private String taxNumber;
    
    @Column(name = "vat_number", length = 50)
    private String vatNumber;
    
    @Column(name = "address_line1", length = 255)
    private String addressLine1;
    
    @Column(name = "address_line2", length = 255)
    private String addressLine2;
    
    @Column(length = 100)
    private String city;
    
    @Column(length = 100)
    private String province;
    
    @Column(name = "postal_code", length = 10)
    private String postalCode;
    
    @Column(length = 50)
    @Builder.Default
    private String country = "South Africa";
    
    @Column(length = 20)
    private String phone;
    
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
    // The FK is stored in the child tables (users.organization_id, vehicles.organization_id)
    // =========================================================================
    
    /**
     * One Organization has many Users
     * INVERSE side - User.organization is the owning side
     * mappedBy = "organization" refers to User.organization field
     * 
     * CascadeType.ALL: When org is saved/deleted, cascade to users
     * orphanRemoval: Delete users when removed from this collection
     */
    @OneToMany(mappedBy = "organization", 
               fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, 
               orphanRemoval = true)
    @Builder.Default
    private Set<User> users = new HashSet<>();
    
    /**
     * One Organization owns many Vehicles
     * INVERSE side - Vehicle.organization is the owning side
     * mappedBy = "organization" refers to Vehicle.organization field
     */
    @OneToMany(mappedBy = "organization", 
               fetch = FetchType.LAZY,
               cascade = CascadeType.ALL, 
               orphanRemoval = true)
    @Builder.Default
    private Set<Vehicle> vehicles = new HashSet<>();
    
    /**
     * One Organization has many Expenses (via vehicles/users)
     * INVERSE side - Expense.organization is the owning side
     * mappedBy = "organization" refers to Expense.organization field
     */
    @OneToMany(mappedBy = "organization", 
               fetch = FetchType.LAZY,
               cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Expense> expenses = new HashSet<>();
    
    /**
     * One Organization has many Trips
     * INVERSE side - Trip.organization is the owning side
     * mappedBy = "organization" refers to Trip.organization field
     */
    @OneToMany(mappedBy = "organization", 
               fetch = FetchType.LAZY,
               cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Trip> trips = new HashSet<>();
    
    // =========================================================================
    // HELPER METHODS FOR BIDIRECTIONAL SYNC
    // Always use these methods to maintain relationship consistency
    // =========================================================================
    
    /**
     * Add a user to this organization (bidirectional sync)
     */
    public void addUser(User user) {
        users.add(user);
        user.setOrganization(this);
    }
    
    /**
     * Remove a user from this organization (bidirectional sync)
     */
    public void removeUser(User user) {
        users.remove(user);
        user.setOrganization(null);
    }
    
    /**
     * Add a vehicle to this organization (bidirectional sync)
     */
    public void addVehicle(Vehicle vehicle) {
        vehicles.add(vehicle);
        vehicle.setOrganization(this);
    }
    
    /**
     * Remove a vehicle from this organization (bidirectional sync)
     */
    public void removeVehicle(Vehicle vehicle) {
        vehicles.remove(vehicle);
        vehicle.setOrganization(null);
    }
    
    /**
     * Check if this is a solo/individual organization
     */
    public boolean isSoloMode() {
        return mode == OrganizationMode.SOLO;
    }
    
    /**
     * Check if this is a fleet/business organization
     */
    public boolean isFleetMode() {
        return mode == OrganizationMode.FLEET;
    }
}

/**
 * Organization Mode Enum
 */
enum OrganizationMode {
    SOLO,   // Individual user (1-person organization)
    FLEET   // Multiple users with fleet management
}
