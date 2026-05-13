package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.vehicleexpense.api.enums.FixedExpenseType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FixedExpense Entity - Insurance, tracking, e-tolls, etc.
 * OWNING side of OneToOne with Expense
 */
@Entity
@Table(name = "fixed_expenses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FixedExpense {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    /**
     * One FixedExpense belongs to one Expense
     * OWNING side - @JsonBackReference prevents recursion
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_fixed_expense_expense"))
    @JsonBackReference
    private Expense expense;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "expense_type", nullable = false, length = 20)
    private FixedExpenseType expenseType;
    
    @Column(name = "provider_name", length = 255)
    private String providerName;
    
    @Column(name = "policy_number", length = 100)
    private String policyNumber;
    
    @Column(name = "coverage_start")
    private LocalDate coverageStart;
    
    @Column(name = "coverage_end")
    private LocalDate coverageEnd;
    
    @Column(name = "payment_frequency", length = 50)
    private String paymentFrequency; // Monthly, Annual, Once-off
    
    @Column(name = "reference_number", length = 100)
    private String referenceNumber;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Helper methods
    
    public boolean isRecurring() {
        return paymentFrequency != null 
            && !paymentFrequency.equalsIgnoreCase("Once-off")
            && !paymentFrequency.equalsIgnoreCase("Once off");
    }
    
    public boolean isCoverageActive() {
        LocalDate today = LocalDate.now();
        if (coverageStart != null && today.isBefore(coverageStart)) {
            return false;
        }
        if (coverageEnd != null && today.isAfter(coverageEnd)) {
            return false;
        }
        return true;
    }
    
    public boolean isCoverageExpiringSoon() {
        if (coverageEnd == null) {
            return false;
        }
        LocalDate warningDate = LocalDate.now().plusDays(30);
        return coverageEnd.isBefore(warningDate) && !coverageEnd.isBefore(LocalDate.now());
    }
    
    public Long getDaysUntilExpiry() {
        if (coverageEnd == null) {
            return null;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), coverageEnd);
    }
}
