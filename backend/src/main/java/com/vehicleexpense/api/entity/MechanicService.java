package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.vehicleexpense.api.enums.ServiceType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * MechanicService Entity - Full workshop invoice tracking
 * OWNING side of OneToOne with Expense
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
    
    /**
     * One MechanicService belongs to one Expense
     * OWNING side - @JsonBackReference prevents recursion
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "expense_id", nullable = false,
                foreignKey = @ForeignKey(name = "fk_mechanic_service_expense"))
    @JsonBackReference
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
    
    public BigDecimal getCombinedCost() {
        BigDecimal labor = laborCostZar != null ? laborCostZar : BigDecimal.ZERO;
        BigDecimal parts = partsCostZar != null ? partsCostZar : BigDecimal.ZERO;
        return labor.add(parts);
    }
    
    public boolean hasWarranty() {
        return warrantyMonths != null && warrantyMonths > 0;
    }
    
    public boolean isServiceDue(Integer currentOdometer) {
        if (nextServiceDueKm != null && currentOdometer != null) {
            return currentOdometer >= nextServiceDueKm;
        }
        if (nextServiceDueDate != null) {
            return LocalDate.now().isAfter(nextServiceDueDate);
        }
        return false;
    }
}
