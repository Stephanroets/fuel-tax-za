package com.vehicleexpense.api.controller;

import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.entity.Expense;
import com.vehicleexpense.api.entity.FuelLog;
import com.vehicleexpense.api.entity.MechanicService;
import com.vehicleexpense.api.entity.MaintenanceTopup;
import com.vehicleexpense.api.entity.Tire;
import com.vehicleexpense.api.entity.FixedExpense;
import com.vehicleexpense.api.enums.ExpenseCategory;
import com.vehicleexpense.api.service.ExpenseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/fuel")
    public ResponseEntity<?> createFuelExpense(
            @RequestParam("data") String expenseData,
            @RequestParam(value = "receipt", required = false) MultipartFile receiptImage,
            @AuthenticationPrincipal User user) {
        try {
            // Parse the expense data from JSON string
            Map<String, Object> data = Map.of("expenseData", expenseData);
            
            // Create fuel expense
            Expense expense = expenseService.createFuelExpense(data, user, receiptImage);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            log.error("Fuel expense creation error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/mechanic")
    public ResponseEntity<?> createMechanicService(
            @RequestParam("data") String expenseData,
            @RequestParam("receipt") MultipartFile invoiceImage,
            @AuthenticationPrincipal User user) {
        try {
            Expense expense = expenseService.createMechanicService(expenseData, user, invoiceImage);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            log.error("Mechanic service creation error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/maintenance")
    public ResponseEntity<?> createMaintenanceTopup(
            @RequestParam("data") String expenseData,
            @RequestParam(value = "receipt", required = false) MultipartFile receiptImage,
            @AuthenticationPrincipal User user) {
        try {
            Expense expense = expenseService.createMaintenanceTopup(expenseData, user, receiptImage);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            log.error("Maintenance topup creation error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/tyres")
    public ResponseEntity<?> createTyrePurchase(
            @RequestParam("data") String expenseData,
            @RequestParam(value = "receipt", required = false) MultipartFile receiptImage,
            @AuthenticationPrincipal User user) {
        try {
            Expense expense = expenseService.createTyrePurchase(expenseData, user, receiptImage);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            log.error("Tyre purchase creation error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/fixed")
    public ResponseEntity<?> createFixedExpense(
            @RequestParam("data") String expenseData,
            @RequestParam(value = "receipt", required = false) MultipartFile receiptImage,
            @AuthenticationPrincipal User user) {
        try {
            Expense expense = expenseService.createFixedExpense(expenseData, user, receiptImage);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            log.error("Fixed expense creation error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/carwash")
    public ResponseEntity<?> createCarWashExpense(
            @RequestParam("data") String expenseData,
            @RequestParam(value = "receipt", required = false) MultipartFile receiptImage,
            @AuthenticationPrincipal User user) {
        try {
            Expense expense = expenseService.createCarWashExpense(expenseData, user, receiptImage);
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            log.error("Car wash expense creation error: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getExpenses(@AuthenticationPrincipal User user) {
        try {
            var expenses = expenseService.getUserExpenses(user);
            return ResponseEntity.ok(expenses);
        } catch (Exception e) {
            log.error("Error fetching expenses: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExpense(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        try {
            var expenses = expenseService.getUserExpenses(user);
            var expense = expenses.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElse(null);
            if (expense == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(expense);
        } catch (Exception e) {
            log.error("Error fetching expense {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = {"application/json", "application/json;charset=UTF-8"}, produces = "application/json")
    public ResponseEntity<?> updateExpense(@PathVariable UUID id, @RequestBody Expense expenseData, @AuthenticationPrincipal User user) {
        try {
            // Find the existing expense
            var expenses = expenseService.getUserExpenses(user);
            var existingExpense = expenses.stream()
                .filter(e -> e.getId().equals(id))
                .findFirst()
                .orElse(null);
            
            if (existingExpense == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Update the expense with new data
            existingExpense.setDescription(expenseData.getDescription());
            existingExpense.setAmountZar(expenseData.getAmountZar());
            existingExpense.setCategory(expenseData.getCategory());
            existingExpense.setExpenseDate(expenseData.getExpenseDate());
            existingExpense.setSupplierName(expenseData.getSupplierName());
            
            // Save the updated expense
            var updatedExpense = expenseService.updateExpense(existingExpense);
            return ResponseEntity.ok(updatedExpense);
        } catch (Exception e) {
            log.error("Error updating expense {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable UUID id, @AuthenticationPrincipal User user) {
        try {
            expenseService.deleteExpense(id, user);
            return ResponseEntity.ok().body(Map.of("message", "Expense deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting expense {}: {}", id, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
