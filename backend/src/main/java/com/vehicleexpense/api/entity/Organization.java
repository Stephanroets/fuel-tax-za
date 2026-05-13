package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.vehicleexpense.api.enums.OrganizationMode;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.ColumnTransformer;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Organization Entity - Root of multi-tenant hierarchy
 * Parent side: Uses @JsonManagedReference to prevent recursion
 */
@Entity
@Table(
    name = "organizations",
    indexes = {
        @Index(name = "idx_org_active", columnList = "is_active"),
        @Index(name = "idx_org_mode", columnList = "mode"),
    }
)
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
    @ColumnTransformer(write = "?::organization_mode")
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
     * One Organization has many Users
     * INVERSE side - User.organization is the owning side
     * @JsonManagedReference: Parent side (will be serialized)
     */
    @OneToMany(
        mappedBy = "organization",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @JsonManagedReference("organization-users")
    @Builder.Default
    private List<User> users = new ArrayList<>();

    /**
     * One Organization owns many Vehicles
     * INVERSE side - Vehicle.organization is the owning side
     * @JsonManagedReference: Parent side (will be serialized)
     */
    @OneToMany(
        mappedBy = "organization",
        fetch = FetchType.LAZY,
        cascade = CascadeType.ALL,
        orphanRemoval = true
    )
    @JsonManagedReference("organization-vehicles")
    @Builder.Default
    private List<Vehicle> vehicles = new ArrayList<>();

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    public void addUser(User user) {
        users.add(user);
        user.setOrganization(this);
    }

    public void removeUser(User user) {
        users.remove(user);
        user.setOrganization(null);
    }

    public void addVehicle(Vehicle vehicle) {
        vehicles.add(vehicle);
        vehicle.setOrganization(this);
    }

    public void removeVehicle(Vehicle vehicle) {
        vehicles.remove(vehicle);
        vehicle.setOrganization(null);
    }

    public boolean isSoloMode() {
        return mode == OrganizationMode.SOLO;
    }

    public boolean isFleetMode() {
        return mode == OrganizationMode.FLEET;
    }
}
