package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Expense Entity - Base expense record for all categories
 * 
 * JPA Relationship Design:
 * - @ManyToOne to Organization: Expense belongs to one Organization (owning side)
 * - @ManyToOne to Vehicle: Expense belongs to one Vehicle (owning side)
 * - @ManyToOne to User: Expense was created by one User (owning side)
 * - @OneToOne to category-specific entities: FuelLog, MechanicService, etc. (inverse side)
 * 
 * Categories (Non-conflicting South African "Recipes"):
 * - FUEL_LOG: Diesel/Petrol purchases with liters and km/L tracking
 * - MECHANIC_SERVICE: Full workshop invoices (Major/Minor Service, Brakes, etc.)
 * - MAINTENANCE_TOPUP: DIY items (Antifreeze, Oil, Wipers, Bulbs, Wash/Valet)
 * - TIRES: Standalone tyre tracking with rotation/mileage
 * - FIXED_ADMIN: Insurance, Tracking, E-Tolls, License Renewal
 * - CAR_WASH: Car wash, valet, engine steam clean
 */
@Entity
@Table(name = "expenses",
       indexes = {
           @Index(name = "idx_expense_org", columnList = "organization_id"),
           @Index(name = "idx_expense_vehicle", columnList = "vehicle_id"),
           @Index(name = "idx_expense_user", columnList = "user_id"),
           @Index(name = "idx_expense_date", columnList = "expense_date"),
           @Index(name = "idx_expense_category", columnList = "category")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Expense {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    /**
     * Many Expenses belong to one Organization
     * This is the OWNING side of the relationship
     * The foreign key (organization_id) is stored in this table
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_expense_organization"))
    private Organization organization;
    
    /**
     * Many Expenses belong to one Vehicle
     * This is the OWNING side of the relationship
     * The foreign key (vehicle_id) is stored in this table
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_expense_vehicle"))
    private Vehicle vehicle;
    
    /**
     * Many Expenses are created by one User
     * This is the OWNING side of the relationship
     * The foreign key (user_id) is stored in this table
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_expense_user"))
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExpenseCategory category;
    
    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;
    
    @Column(name = "amount_zar", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountZar;
    
    @Column(name = "vat_amount_zar", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal vatAmountZar = BigDecimal.ZERO;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "receipt_image_url", length = 500)
    private String receiptImageUrl;
    
    @Column(name = "receipt_image_key", length = 255)
    private String receiptImageKey;
    
    @Column(name = "odometer_reading")
    private Integer odometerReading;
    
    @Column(name = "supplier_name", length = 255)
    private String supplierName;
    
    @Column(name = "invoice_number", length = 100)
    private String invoiceNumber;
    
    @Column(name = "is_tax_deductible", nullable = false)
    @Builder.Default
    private Boolean isTaxDeductible = true;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // =========================================================================
    // INVERSE RELATIONSHIPS - Category-specific details
    // Only one of these will be populated based on the category
    // mappedBy = "expense" refers to the child entity's "expense" field
    // =========================================================================
    
    /**
     * One Expense may have one FuelLog (if category = FUEL_LOG)
     * INVERSE side - FuelLog.expense is the owning side
     * mappedBy = "expense" refers to FuelLog.expense field
     */
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    private FuelLog fuelLog;
    
    /**
     * One Expense may have one MechanicService (if category = MECHANIC_SERVICE)
     * INVERSE side - MechanicService.expense is the owning side
     * mappedBy = "expense" refers to MechanicService.expense field
     */
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    private MechanicService mechanicService;
    
    /**
     * One Expense may have one MaintenanceTopup (if category = MAINTENANCE_TOPUP)
     * INVERSE side - MaintenanceTopup.expense is the owning side
     * mappedBy = "expense" refers to MaintenanceTopup.expense field
     */
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    private MaintenanceTopup maintenanceTopup;
    
    /**
     * One Expense may have one Tire record (if category = TIRES)
     * INVERSE side - Tire.expense is the owning side
     * mappedBy = "expense" refers to Tire.expense field
     */
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    private Tire tire;
    
    /**
     * One Expense may have one FixedExpense (if category = FIXED_ADMIN)
     * INVERSE side - FixedExpense.expense is the owning side
     * mappedBy = "expense" refers to FixedExpense.expense field
     */
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    private FixedExpense fixedExpense;
    
    /**
     * One Expense may have one CarWash record (if category = CAR_WASH)
     * INVERSE side - CarWash.expense is the owning side
     * mappedBy = "expense" refers to CarWash.expense field
     */
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    private CarWash carWash;
    
    // =========================================================================
    // HELPER METHODS
    // =========================================================================
    
    public UUID getOrganizationId() {
        return organization != null ? organization.getId() : null;
    }
    
    public UUID getVehicleId() {
        return vehicle != null ? vehicle.getId() : null;
    }
    
    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }
    
    /**
     * Get total amount including VAT
     */
    public BigDecimal getTotalAmount() {
        return amountZar;
    }
    
    /**
     * Get amount excluding VAT (for tax calculations)
     */
    public BigDecimal getAmountExcludingVat() {
        if (vatAmountZar != null && vatAmountZar.compareTo(BigDecimal.ZERO) > 0) {
            return amountZar.subtract(vatAmountZar);
        }
        return amountZar;
    }
    
    /**
     * Set fuel log with bidirectional sync
     */
    public void setFuelLogWithSync(FuelLog fuelLog) {
        this.fuelLog = fuelLog;
        if (fuelLog != null) {
            fuelLog.setExpense(this);
        }
    }
    
    /**
     * Set mechanic service with bidirectional sync
     */
    public void setMechanicServiceWithSync(MechanicService mechanicService) {
        this.mechanicService = mechanicService;
        if (mechanicService != null) {
            mechanicService.setExpense(this);
        }
    }
    
    /**
     * Update vehicle odometer if this expense has a reading
     * Called automatically by JPA lifecycle callbacks
     */
    @PostPersist
    @PostUpdate
    public void updateVehicleOdometer() {
        if (odometerReading != null && vehicle != null) {
            vehicle.updateOdometer(odometerReading);
        }
    }
}

/**
 * Expense Category Enum - Non-conflicting South African "Recipes"
 */
enum ExpenseCategory {
    FUEL_LOG("Fuel"),
    MECHANIC_SERVICE("Service & Repairs"),
    MAINTENANCE_TOPUP("Maintenance Top-ups (DIY)"),
    TIRES("Tyres"),
    FIXED_ADMIN("Fixed & Admin"),
    CAR_WASH("Wash & Valet");
    
    private final String displayName;
    
    ExpenseCategory(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
