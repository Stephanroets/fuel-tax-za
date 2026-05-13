package com.vehicleexpense.api.controllers;

import com.vehicleexpense.api.dto.*;
import com.vehicleexpense.api.security.TenantUserPrincipal;
import com.vehicleexpense.api.services.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Expense Controller
 * 
 * Handles all expense-related operations with automatic tenant filtering.
 * Supports the five non-conflicting South African expense "recipes":
 * - Fuel Log
 * - Mechanic Service
 * - Maintenance Top-ups (DIY)
 * - Tyres
 * - Fixed & Admin
 */
@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "Vehicle expense management (ZAR)")
public class ExpenseController {
    
    private final ExpenseService expenseService;
    
    /**
     * Get all expenses for the organization (with filtering)
     */
    @GetMapping
    @Operation(summary = "List all expenses", description = "Get paginated expenses with optional filters")
    public ResponseEntity<Page<ExpenseResponseDto>> getAllExpenses(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam(required = false) ExpenseCategory category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            Pageable pageable
    ) {
        Page<ExpenseResponseDto> expenses = expenseService.getExpenses(
            principal.organizationId(),
            principal.userId(),
            principal.role(),
            vehicleId,
            category,
            fromDate,
            toDate,
            pageable
        );
        
        return ResponseEntity.ok(expenses);
    }
    
    /**
     * Get a single expense by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get expense by ID")
    public ResponseEntity<ExpenseResponseDto> getExpenseById(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @PathVariable UUID id
    ) {
        ExpenseResponseDto expense = expenseService.getExpenseById(
            id, 
            principal.organizationId(),
            principal.userId(),
            principal.role()
        );
        
        return ResponseEntity.ok(expense);
    }
    
    /**
     * Create a new fuel log expense
     */
    @PostMapping(value = "/fuel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Log a fuel purchase")
    public ResponseEntity<ExpenseResponseDto> createFuelLog(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @Valid @RequestPart("data") CreateFuelLogDto dto,
            @RequestPart(value = "receipt", required = false) MultipartFile receiptImage
    ) {
        ExpenseResponseDto expense = expenseService.createFuelLog(
            principal.organizationId(),
            principal.userId(),
            dto,
            receiptImage
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }
    
    /**
     * Create a new mechanic service expense
     */
    @PostMapping(value = "/mechanic-service", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Log a mechanic service invoice")
    public ResponseEntity<ExpenseResponseDto> createMechanicService(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @Valid @RequestPart("data") CreateMechanicServiceDto dto,
            @RequestPart(value = "receipt", required = false) MultipartFile receiptImage
    ) {
        ExpenseResponseDto expense = expenseService.createMechanicService(
            principal.organizationId(),
            principal.userId(),
            dto,
            receiptImage
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }
    
    /**
     * Create a new maintenance top-up expense (DIY)
     */
    @PostMapping(value = "/maintenance-topup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Log a DIY maintenance purchase")
    public ResponseEntity<ExpenseResponseDto> createMaintenanceTopup(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @Valid @RequestPart("data") CreateMaintenanceTopupDto dto,
            @RequestPart(value = "receipt", required = false) MultipartFile receiptImage
    ) {
        ExpenseResponseDto expense = expenseService.createMaintenanceTopup(
            principal.organizationId(),
            principal.userId(),
            dto,
            receiptImage
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }
    
    /**
     * Create a new tyre expense
     */
    @PostMapping(value = "/tires", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Log a tyre purchase")
    public ResponseEntity<ExpenseResponseDto> createTireExpense(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @Valid @RequestPart("data") CreateTireDto dto,
            @RequestPart(value = "receipt", required = false) MultipartFile receiptImage
    ) {
        ExpenseResponseDto expense = expenseService.createTireExpense(
            principal.organizationId(),
            principal.userId(),
            dto,
            receiptImage
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }
    
    /**
     * Create a new fixed/admin expense
     */
    @PostMapping(value = "/fixed-admin", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Log a fixed/admin expense (insurance, tracking, e-tolls)")
    public ResponseEntity<ExpenseResponseDto> createFixedExpense(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @Valid @RequestPart("data") CreateFixedExpenseDto dto,
            @RequestPart(value = "receipt", required = false) MultipartFile receiptImage
    ) {
        ExpenseResponseDto expense = expenseService.createFixedExpense(
            principal.organizationId(),
            principal.userId(),
            dto,
            receiptImage
        );
        
        return ResponseEntity.status(HttpStatus.CREATED).body(expense);
    }
    
    /**
     * Update an expense
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update an expense")
    public ResponseEntity<ExpenseResponseDto> updateExpense(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExpenseDto dto
    ) {
        ExpenseResponseDto expense = expenseService.updateExpense(
            id,
            principal.organizationId(),
            principal.userId(),
            principal.role(),
            dto
        );
        
        return ResponseEntity.ok(expense);
    }
    
    /**
     * Delete an expense (Admin only)
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an expense (Admin only)")
    public ResponseEntity<Void> deleteExpense(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @PathVariable UUID id
    ) {
        expenseService.deleteExpense(id, principal.organizationId());
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get expense summary by category for a date range
     */
    @GetMapping("/summary")
    @Operation(summary = "Get expense summary by category")
    public ResponseEntity<ExpenseSummaryDto> getExpenseSummary(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @RequestParam(required = false) UUID vehicleId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        ExpenseSummaryDto summary = expenseService.getExpenseSummary(
            principal.organizationId(),
            principal.userId(),
            principal.role(),
            vehicleId,
            fromDate,
            toDate
        );
        
        return ResponseEntity.ok(summary);
    }
    
    /**
     * Get fuel efficiency history for a vehicle
     */
    @GetMapping("/fuel-efficiency/{vehicleId}")
    @Operation(summary = "Get fuel efficiency history")
    public ResponseEntity<List<FuelEfficiencyDto>> getFuelEfficiencyHistory(
            @AuthenticationPrincipal TenantUserPrincipal principal,
            @PathVariable UUID vehicleId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<FuelEfficiencyDto> history = expenseService.getFuelEfficiencyHistory(
            principal.organizationId(),
            vehicleId,
            limit
        );
        
        return ResponseEntity.ok(history);
    }
}

// DTOs would be in separate files
record CreateFuelLogDto(
    UUID vehicleId,
    LocalDate expenseDate,
    FuelType fuelType,
    java.math.BigDecimal liters,
    java.math.BigDecimal pricePerLiter,
    Integer odometerReading,
    Boolean fullTank,
    String stationName,
    String stationLocation,
    String description
) {}

record CreateMechanicServiceDto(
    UUID vehicleId,
    LocalDate expenseDate,
    java.math.BigDecimal amountZar,
    java.math.BigDecimal vatAmountZar,
    Integer odometerReading,
    ServiceType serviceType,
    String workshopName,
    String workshopPhone,
    String workshopAddress,
    String technicianName,
    java.math.BigDecimal laborCostZar,
    java.math.BigDecimal partsCostZar,
    String workDescription,
    String partsReplaced,
    Integer warrantyMonths,
    Integer nextServiceDueKm,
    LocalDate nextServiceDueDate,
    String invoiceNumber,
    String description
) {}

record CreateMaintenanceTopupDto(
    UUID vehicleId,
    LocalDate expenseDate,
    java.math.BigDecimal amountZar,
    java.math.BigDecimal vatAmountZar,
    Integer odometerReading,
    MaintenanceItemType itemType,
    String itemBrand,
    java.math.BigDecimal itemQuantity,
    String itemUnit,
    String shopName,
    String notes,
    String description
) {}

record CreateTireDto(
    UUID vehicleId,
    LocalDate expenseDate,
    java.math.BigDecimal amountZar,
    java.math.BigDecimal vatAmountZar,
    Integer odometerReading,
    String brand,
    String model,
    String size,
    Integer quantity,
    String position,
    java.math.BigDecimal treadDepthMm,
    Integer expectedLifespanKm,
    Integer rotationIntervalKm,
    Integer warrantyKm,
    String notes,
    String supplierName,
    String invoiceNumber,
    String description
) {}

record CreateFixedExpenseDto(
    UUID vehicleId,
    LocalDate expenseDate,
    java.math.BigDecimal amountZar,
    java.math.BigDecimal vatAmountZar,
    FixedExpenseType expenseType,
    String providerName,
    String policyNumber,
    LocalDate coverageStart,
    LocalDate coverageEnd,
    String paymentFrequency,
    String referenceNumber,
    String notes,
    String description
) {}

// Enums referenced
enum ExpenseCategory { FUEL_LOG, MECHANIC_SERVICE, MAINTENANCE_TOPUP, TIRES, FIXED_ADMIN }
enum FuelType { DIESEL_10PPM, DIESEL_50PPM, DIESEL_500PPM, PETROL_UNLEADED_93, PETROL_UNLEADED_95 }
enum ServiceType { MAJOR_SERVICE, MINOR_SERVICE, BRAKE_OVERHAUL, ENGINE_REPAIR, TRANSMISSION, SUSPENSION, ELECTRICAL, AIR_CONDITIONING, OTHER }
enum MaintenanceItemType { ANTIFREEZE, OIL, WIPER_BLADES, LIGHT_BULBS, VEHICLE_WASH, VALET }
enum FixedExpenseType { INSURANCE_PREMIUM, VEHICLE_TRACKING, ETOLL_SANRAL, LICENSE_RENEWAL, ROADWORTHY, OTHER }
