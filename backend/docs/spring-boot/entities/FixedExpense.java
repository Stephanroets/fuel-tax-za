package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * FixedExpense Entity - Insurance, tracking, e-tolls, etc.
 * 
 * Fixed & Admin expenses for South Africa:
 * - Insurance Premium (monthly/annual)
 * - Vehicle Tracking (Netstar, Tracker, etc.)
 * - E-Tolls (SANRAL)
 * - License Renewal (annual)
 * - Roadworthy Certificate
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
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
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
    
    /**
     * Check if this is a recurring expense
     */
    public boolean isRecurring() {
        return paymentFrequency != null 
            && !paymentFrequency.equalsIgnoreCase("Once-off")
            && !paymentFrequency.equalsIgnoreCase("Once off");
    }
    
    /**
     * Check if coverage is currently active
     */
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
    
    /**
     * Check if coverage is expiring soon (within 30 days)
     */
    public boolean isCoverageExpiringSoon() {
        if (coverageEnd == null) {
            return false;
        }
        LocalDate warningDate = LocalDate.now().plusDays(30);
        return coverageEnd.isBefore(warningDate) && !coverageEnd.isBefore(LocalDate.now());
    }
    
    /**
     * Get days until coverage expires
     */
    public Long getDaysUntilExpiry() {
        if (coverageEnd == null) {
            return null;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), coverageEnd);
    }
    
    /**
     * Get display string for provider info
     */
    public String getProviderDisplay() {
        StringBuilder sb = new StringBuilder();
        if (providerName != null && !providerName.isEmpty()) {
            sb.append(providerName);
        }
        if (policyNumber != null && !policyNumber.isEmpty()) {
            if (sb.length() > 0) {
                sb.append(" - ");
            }
            sb.append("Policy: ").append(policyNumber);
        }
        return sb.toString();
    }
}

/**
 * Fixed Expense Type Enum
 */
enum FixedExpenseType {
    INSURANCE_PREMIUM("Insurance Premium"),
    VEHICLE_TRACKING("Vehicle Tracking"),
    ETOLL_SANRAL("E-Tolls (SANRAL)"),
    LICENSE_RENEWAL("License Renewal"),
    ROADWORTHY("Roadworthy Certificate"),
    OTHER("Other");
    
    private final String displayName;
    
    FixedExpenseType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Check if this type typically has policy numbers
     */
    public boolean hasPolicy() {
        return this == INSURANCE_PREMIUM || this == VEHICLE_TRACKING;
    }
    
    /**
     * Check if this type is typically recurring
     */
    public boolean isTypicallyRecurring() {
        return this == INSURANCE_PREMIUM 
            || this == VEHICLE_TRACKING 
            || this == ETOLL_SANRAL;
    }
}
