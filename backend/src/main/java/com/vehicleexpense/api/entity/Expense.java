package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.vehicleexpense.api.enums.ExpenseCategory;
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
 * Relationship Design:
 * - OWNING side: Expense.organization, Expense.vehicle, Expense.user
 * - INVERSE side: Expense.fuelLog, Expense.mechanicService, etc.
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
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_expense_organization"))
    @JsonBackReference
    private Organization organization;
    
    /**
     * Many Expenses belong to one Vehicle
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "vehicle_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_expense_vehicle"))
    @JsonManagedReference("vehicle-expenses")
    private Vehicle vehicle;
    
    /**
     * Many Expenses are created by one User
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_expense_user"))
    @JsonBackReference("user-expenses")
    private User user;
    
    @Column(nullable = false, columnDefinition = "expense_category")
    private String category;
    
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
    // =========================================================================
    
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.EAGER,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    @JsonManagedReference
    private FuelLog fuelLog;
    
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    @JsonManagedReference
    private MechanicService mechanicService;
    
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    @JsonManagedReference
    private MaintenanceTopup maintenanceTopup;
    
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    @JsonManagedReference
    private Tire tire;
    
    @OneToOne(mappedBy = "expense", 
              fetch = FetchType.LAZY,
              cascade = CascadeType.ALL, 
              orphanRemoval = true)
    @JsonManagedReference
    private FixedExpense fixedExpense;
    
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
    
    public BigDecimal getAmountExcludingVat() {
        if (vatAmountZar != null && vatAmountZar.compareTo(BigDecimal.ZERO) > 0) {
            return amountZar.subtract(vatAmountZar);
        }
        return amountZar;
    }
    
    @PostPersist
    @PostUpdate
    public void updateVehicleOdometer() {
        if (odometerReading != null && vehicle != null) {
            vehicle.updateOdometer(odometerReading);
        }
    }
}
