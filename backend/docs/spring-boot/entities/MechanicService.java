package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MechanicService Entity - Full workshop invoice tracking
 * 
 * Distinct from MaintenanceTopup:
 * - MechanicService = Professional workshop with labor + parts invoice
 * - MaintenanceTopup = DIY purchase at shop (oil, antifreeze, etc.)
 * 
 * One invoice image for the whole service event.
 */
@Entity
@Table(name = "mechanic_services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MechanicService {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "service_type", nullable = false, length = 20)
    private ServiceType serviceType;
    
    @Column(name = "workshop_name", nullable = false, length = 255)
    private String workshopName;
    
    @Column(name = "workshop_phone", length = 20)
    private String workshopPhone;
    
    @Column(name = "workshop_address", length = 500)
    private String workshopAddress;
    
    @Column(name = "technician_name", length = 100)
    private String technicianName;
    
    @Column(name = "labor_cost_zar", precision = 12, scale = 2)
    private BigDecimal laborCostZar;
    
    @Column(name = "parts_cost_zar", precision = 12, scale = 2)
    private BigDecimal partsCostZar;
    
    @Column(name = "work_description", columnDefinition = "TEXT")
    private String workDescription;
    
    @Column(name = "parts_replaced", columnDefinition = "TEXT")
    private String partsReplaced;
    
    @Column(name = "warranty_months")
    private Integer warrantyMonths;
    
    @Column(name = "next_service_due_km")
    private Integer nextServiceDueKm;
    
    @Column(name = "next_service_due_date")
    private LocalDate nextServiceDueDate;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // Helper methods
    
    /**
     * Get combined cost (labor + parts)
     * Should match parent expense.amountZar
     */
    public BigDecimal getCombinedCost() {
        BigDecimal labor = laborCostZar != null ? laborCostZar : BigDecimal.ZERO;
        BigDecimal parts = partsCostZar != null ? partsCostZar : BigDecimal.ZERO;
        return labor.add(parts);
    }
    
    /**
     * Check if service has warranty
     */
    public boolean hasWarranty() {
        return warrantyMonths != null && warrantyMonths > 0;
    }
    
    /**
     * Check if next service is due based on current odometer
     */
    public boolean isServiceDue(Integer currentOdometer) {
        if (nextServiceDueKm != null && currentOdometer != null) {
            return currentOdometer >= nextServiceDueKm;
        }
        if (nextServiceDueDate != null) {
            return LocalDate.now().isAfter(nextServiceDueDate);
        }
        return false;
    }
    
    /**
     * Get km until next service
     */
    public Integer getKmUntilNextService(Integer currentOdometer) {
        if (nextServiceDueKm != null && currentOdometer != null) {
            return Math.max(0, nextServiceDueKm - currentOdometer);
        }
        return null;
    }
}

/**
 * Service Type Enum
 */
enum ServiceType {
    MAJOR_SERVICE("Major Service"),
    MINOR_SERVICE("Minor Service"),
    BRAKE_OVERHAUL("Brake Overhaul"),
    ENGINE_REPAIR("Engine Repair"),
    TRANSMISSION("Transmission"),
    SUSPENSION("Suspension"),
    ELECTRICAL("Electrical"),
    AIR_CONDITIONING("Air Conditioning"),
    OTHER("Other");
    
    private final String displayName;
    
    ServiceType(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
