package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * User Entity - Multi-tenant user with role-based access
 * 
 * JPA Relationship Design:
 * - @ManyToOne: User belongs to one Organization (owning side)
 * - @OneToMany(mappedBy): User has many Expenses, Trips, OdometerVerifications (inverse side)
 * - Vehicle assignment is handled via Vehicle.assignedDriver @ManyToOne
 * 
 * Roles:
 * - ADMIN: Full access to organization data
 * - MANAGER: Can view all, manage assigned vehicles/drivers
 * - DRIVER: Can only access assigned vehicles and own data
 */
@Entity
@Table(name = "users", 
       uniqueConstraints = @UniqueConstraint(columnNames = "email"),
       indexes = {
           @Index(name = "idx_user_org", columnList = "organization_id"),
           @Index(name = "idx_user_email", columnList = "email"),
           @Index(name = "idx_user_active", columnList = "is_active")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    /**
     * Many Users belong to one Organization
     * This is the OWNING side of the relationship
     * The foreign key (organization_id) is stored in this table
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false, 
                foreignKey = @ForeignKey(name = "fk_user_organization"))
    private Organization organization;
    
    @Column(nullable = false, unique = true, length = 255)
    private String email;
    
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;
    
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private UserRole role = UserRole.DRIVER;
    
    @Column(length = 20)
    private String phone;
    
    @Column(name = "employee_number", length = 50)
    private String employeeNumber;
    
    @Column(name = "drivers_license_number", length = 50)
    private String driversLicenseNumber;
    
    @Column(name = "drivers_license_expiry")
    private LocalDate driversLicenseExpiry;
    
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;
    
    @Column(name = "verification_token", length = 255)
    private String verificationToken;
    
    @Column(name = "verification_token_expires")
    private LocalDateTime verificationTokenExpires;
    
    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;
    
    @Column(name = "password_reset_expires")
    private LocalDateTime passwordResetExpires;
    
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
    
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
     * One User can be assigned to many Vehicles
     * INVERSE side - Vehicle.assignedDriver is the owning side
     * mappedBy = "assignedDriver" refers to Vehicle.assignedDriver field
     */
    @OneToMany(mappedBy = "assignedDriver", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<Vehicle> assignedVehicles = new HashSet<>();
    
    /**
     * One User creates many Expenses
     * INVERSE side - Expense.user is the owning side
     * mappedBy = "user" refers to Expense.user field
     */
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Expense> expenses = new HashSet<>();
    
    /**
     * One User logs many Trips
     * INVERSE side - Trip.user is the owning side
     * mappedBy = "user" refers to Trip.user field
     */
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<Trip> trips = new HashSet<>();
    
    /**
     * One User captures many OdometerVerifications
     * INVERSE side - OdometerVerification.user is the owning side
     * mappedBy = "user" refers to OdometerVerification.user field
     */
    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @Builder.Default
    private Set<OdometerVerification> odometerVerifications = new HashSet<>();
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }
    
    public boolean isManager() {
        return role == UserRole.MANAGER;
    }
    
    public boolean isDriver() {
        return role == UserRole.DRIVER;
    }
    
    public UUID getOrganizationId() {
        return organization != null ? organization.getId() : null;
    }
    
    /**
     * Add an expense to this user (bidirectional sync)
     */
    public void addExpense(Expense expense) {
        expenses.add(expense);
        expense.setUser(this);
    }
    
    /**
     * Remove an expense from this user (bidirectional sync)
     */
    public void removeExpense(Expense expense) {
        expenses.remove(expense);
        expense.setUser(null);
    }
}

/**
 * User Role Enum
 */
enum UserRole {
    ADMIN,      // Full organization access
    MANAGER,    // View all, manage subset
    DRIVER      // Limited to assigned vehicles
}
