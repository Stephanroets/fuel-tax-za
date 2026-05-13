package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.vehicleexpense.api.enums.UserRole;
import jakarta.persistence.*;
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
 * User Entity - Multi-tenant user with role-based access
 *
 * Relationship Design:
 * - OWNING side: User.organization (@ManyToOne @JoinColumn)
 * - INVERSE side: User.expenses, User.vehicles (@OneToMany mappedBy)
 * - @JsonBackReference on owning side, @JsonManagedReference on inverse side
 */
@Entity
@Table(
    name = "users",
    uniqueConstraints = @UniqueConstraint(columnNames = "email"),
    indexes = {
        @Index(name = "idx_user_org", columnList = "organization_id"),
        @Index(name = "idx_user_email", columnList = "email"),
        @Index(name = "idx_user_active", columnList = "is_active"),
    }
)
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
     * @JsonBackReference: Child side (won't be serialized - prevents recursion)
     */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(
        name = "organization_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_user_organization")
    )
    @JsonBackReference("organization-users")
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
    @ColumnTransformer(write = "?::user_role")
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
    private OffsetDateTime verificationTokenExpires;

    @Column(name = "password_reset_token", length = 255)
    private String passwordResetToken;

    @Column(name = "password_reset_expires")
    private OffsetDateTime passwordResetExpires;

    @Column(name = "last_login")
    private OffsetDateTime lastLogin;

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
     * One User can be assigned to many Vehicles
     * INVERSE side - Vehicle.assignedDriver is the owning side
     * @JsonManagedReference: Parent side
     */
    @OneToMany(mappedBy = "assignedDriver", fetch = FetchType.LAZY)
    @JsonManagedReference("user-vehicles")
    @Builder.Default
    private List<Vehicle> assignedVehicles = new ArrayList<>();

    /**
     * One User creates many Expenses
     * INVERSE side - Expense.user is the owning side
     * @JsonManagedReference: Parent side
     */
    @OneToMany(
        mappedBy = "user",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL
    )
    @JsonManagedReference("user-expenses")
    @Builder.Default
    private List<Expense> expenses = new ArrayList<>();

    /**
     * One User logs many Trips
     * INVERSE side - Trip.user is the owning side
     * @JsonManagedReference: Parent side
     */
    @OneToMany(
        mappedBy = "user",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL
    )
    @JsonManagedReference("user-trips")
    @Builder.Default
    private List<Trip> trips = new ArrayList<>();

    /**
     * One User captures many OdometerVerifications
     * INVERSE side - OdometerVerification.user is the owning side
     * @JsonManagedReference: Parent side
     */
    @OneToMany(
        mappedBy = "user",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL
    )
    @JsonManagedReference("user-verifications")
    @Builder.Default
    private List<OdometerVerification> odometerVerifications =
        new ArrayList<>();

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
}
