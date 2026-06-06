package com.vehicleexpense.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vehicleexpense.api.entity.*;
import com.vehicleexpense.api.enums.ExpenseCategory;
import com.vehicleexpense.api.enums.FuelType;
import com.vehicleexpense.api.repository.ExpenseRepository;
import com.vehicleexpense.api.repository.VehicleRepository;
import com.vehicleexpense.api.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final VehicleRepository vehicleRepository;
    private final FileStorageService fileStorageService;
    private final ObjectMapper objectMapper;

    @Transactional
    public Expense createFuelExpense(Map<String, Object> expenseData, User user, MultipartFile receiptImage) {
        try {
            // Parse JSON string from expenseData
            String jsonStr = (String) expenseData.get("expenseData");
            // Parse the expense data from JSON string
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(jsonStr, Map.class);
            
            // Parse date - handle both ISO datetime and date-only formats
            String dateStr = (String) data.get("date");
            LocalDate expenseDate;
            if (dateStr.contains("T")) {
                // ISO datetime format - extract date part
                expenseDate = LocalDate.parse(dateStr.substring(0, 10));
            } else {
                // Date-only format
                expenseDate = LocalDate.parse(dateStr);
            }
            
            // Get vehicle
            UUID vehicleId = UUID.fromString((String) data.get("vehicleId"));
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

            // Create main expense record
            Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(user)
                .vehicle(vehicle)
                .organization(user.getOrganization())
                .category("FUEL_LOG")
                .expenseDate(expenseDate)
                .amountZar(new BigDecimal(data.get("amount").toString()))
                .description((String) data.get("description"))
                .supplierName((String) data.get("supplierName"))
                .build();

            expense = expenseRepository.save(expense);

            // Create fuel log specific record
            FuelLog fuelLog = FuelLog.builder()
                .id(UUID.randomUUID())
                .expense(expense)
                .fuelType(FuelType.valueOf((String) data.get("fuelType")))
                .liters(new BigDecimal(data.get("liters").toString()))
                .pricePerLiter(new BigDecimal(data.get("pricePerLiter").toString()))
                .fullTank((Boolean) data.getOrDefault("fullTank", true))
                .stationName((String) data.get("stationName"))
                .build();

            // Handle receipt image if provided
            if (receiptImage != null) {
                String filename = fileStorageService.generateUniqueFilename("receipt", receiptImage.getOriginalFilename());
                String imageUrl = fileStorageService.storeFile(receiptImage, "receipts", filename);
                expense.setReceiptImageUrl(imageUrl);
                expense.setReceiptImageKey(filename);
            }

            expenseRepository.save(expense);
            log.info("Created fuel expense: {} for user: {}", expense.getId(), user.getEmail());
            
            return expense;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating fuel expense: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create fuel expense", e);
        }
    }

    @Transactional
    public Expense createMechanicService(String expenseData, User user, MultipartFile invoiceImage) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(expenseData, Map.class);

            // Parse date - handle both ISO datetime and date-only formats
            String dateStr = (String) data.get("date");
            LocalDate expenseDate;
            if (dateStr.contains("T")) {
                // ISO datetime format - extract date part
                expenseDate = LocalDate.parse(dateStr.substring(0, 10));
            } else {
                // Date-only format
                expenseDate = LocalDate.parse(dateStr);
            }

            UUID vehicleId = UUID.fromString((String) data.get("vehicleId"));
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

            Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(user)
                .vehicle(vehicle)
                .organization(user.getOrganization())
                .category("MECHANIC_SERVICE")
                .expenseDate(expenseDate)
                .amountZar(new BigDecimal(data.get("amount").toString()))
                .description((String) data.get("description"))
                .supplierName((String) data.get("supplierName"))
                .build();

            if (invoiceImage != null) {
                String filename = fileStorageService.generateUniqueFilename("invoice", invoiceImage.getOriginalFilename());
                String imageUrl = fileStorageService.storeFile(invoiceImage, "receipts", filename);
                expense.setReceiptImageUrl(imageUrl);
                expense.setReceiptImageKey(filename);
            }

            expense = expenseRepository.save(expense);
            log.info("Created mechanic service expense: {} for user: {}", expense.getId(), user.getEmail());
            
            return expense;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating mechanic service: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create mechanic service", e);
        }
    }

    @Transactional
    public Expense createMaintenanceTopup(String expenseData, User user, MultipartFile receiptImage) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(expenseData, Map.class);

            // Parse date - handle both ISO datetime and date-only formats
            String dateStr = (String) data.get("date");
            LocalDate expenseDate;
            if (dateStr.contains("T")) {
                // ISO datetime format - extract date part
                expenseDate = LocalDate.parse(dateStr.substring(0, 10));
            } else {
                // Date-only format
                expenseDate = LocalDate.parse(dateStr);
            }

            UUID vehicleId = UUID.fromString((String) data.get("vehicleId"));
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

            Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(user)
                .vehicle(vehicle)
                .organization(user.getOrganization())
                .category("MAINTENANCE_TOPUP")
                .expenseDate(expenseDate)
                .amountZar(new BigDecimal(data.get("amount").toString()))
                .description((String) data.get("description"))
                .supplierName((String) data.get("supplierName"))
                .build();

            if (receiptImage != null) {
                String filename = fileStorageService.generateUniqueFilename("receipt", receiptImage.getOriginalFilename());
                String imageUrl = fileStorageService.storeFile(receiptImage, "receipts", filename);
                expense.setReceiptImageUrl(imageUrl);
                expense.setReceiptImageKey(filename);
            }

            expense = expenseRepository.save(expense);
            log.info("Created maintenance topup expense: {} for user: {}", expense.getId(), user.getEmail());
            
            return expense;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating maintenance topup: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create maintenance topup", e);
        }
    }

    @Transactional
    public Expense createTyrePurchase(String expenseData, User user, MultipartFile receiptImage) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(expenseData, Map.class);

            // Parse date - handle both ISO datetime and date-only formats
            String dateStr = (String) data.get("date");
            LocalDate expenseDate;
            if (dateStr.contains("T")) {
                // ISO datetime format - extract date part
                expenseDate = LocalDate.parse(dateStr.substring(0, 10));
            } else {
                // Date-only format
                expenseDate = LocalDate.parse(dateStr);
            }

            UUID vehicleId = UUID.fromString((String) data.get("vehicleId"));
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

            Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(user)
                .vehicle(vehicle)
                .organization(user.getOrganization())
                .category("TIRES")
                .expenseDate(expenseDate)
                .amountZar(new BigDecimal(data.get("amount").toString()))
                .description((String) data.get("description"))
                .supplierName((String) data.get("supplierName"))
                .odometerReading(data.containsKey("odometerReading") ? 
                    (Integer) data.get("odometerReading") : null)
                .build();

            if (receiptImage != null) {
                String filename = fileStorageService.generateUniqueFilename("receipt", receiptImage.getOriginalFilename());
                String imageUrl = fileStorageService.storeFile(receiptImage, "receipts", filename);
                expense.setReceiptImageUrl(imageUrl);
                expense.setReceiptImageKey(filename);
            }

            expense = expenseRepository.save(expense);
            log.info("Created tyre purchase expense: {} for user: {}", expense.getId(), user.getEmail());
            
            return expense;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating tyre purchase: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create tyre purchase", e);
        }
    }

    @Transactional
    public Expense createFixedExpense(String expenseData, User user, MultipartFile receiptImage) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(expenseData, Map.class);

            // Parse date - handle both ISO datetime and date-only formats
            String dateStr = (String) data.get("date");
            LocalDate expenseDate;
            if (dateStr.contains("T")) {
                // ISO datetime format - extract date part
                expenseDate = LocalDate.parse(dateStr.substring(0, 10));
            } else {
                // Date-only format
                expenseDate = LocalDate.parse(dateStr);
            }

            UUID vehicleId = UUID.fromString((String) data.get("vehicleId"));
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

            Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(user)
                .vehicle(vehicle)
                .organization(user.getOrganization())
                .category("FIXED_ADMIN")
                .expenseDate(expenseDate)
                .amountZar(new BigDecimal(data.get("amount").toString()))
                .description((String) data.get("description"))
                .supplierName((String) data.get("supplierName"))
                .build();

            if (receiptImage != null) {
                String filename = fileStorageService.generateUniqueFilename("receipt", receiptImage.getOriginalFilename());
                String imageUrl = fileStorageService.storeFile(receiptImage, "receipts", filename);
                expense.setReceiptImageUrl(imageUrl);
                expense.setReceiptImageKey(filename);
            }

            expense = expenseRepository.save(expense);
            log.info("Created fixed expense: {} for user: {}", expense.getId(), user.getEmail());
            
            return expense;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating fixed expense: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create fixed expense", e);
        }
    }

    @Transactional
    public Expense createCarWashExpense(String expenseData, User user, MultipartFile receiptImage) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(expenseData, Map.class);

            UUID vehicleId = UUID.fromString((String) data.get("vehicleId"));
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

            // Parse date - handle both ISO datetime and date-only formats
            String dateStr = (String) data.get("date");
            LocalDate expenseDate;
            if (dateStr.contains("T")) {
                // ISO datetime format - extract date part
                expenseDate = LocalDate.parse(dateStr.substring(0, 10));
            } else {
                // Date-only format
                expenseDate = LocalDate.parse(dateStr);
            }

            Expense expense = Expense.builder()
                .id(UUID.randomUUID())
                .user(user)
                .vehicle(vehicle)
                .organization(user.getOrganization())
                .category("FIXED_ADMIN")
                .expenseDate(expenseDate)
                .amountZar(new BigDecimal(data.get("amount").toString()))
                .description((String) data.get("description"))
                .supplierName((String) data.get("supplierName"))
                .build();

            if (receiptImage != null) {
                String filename = fileStorageService.generateUniqueFilename("receipt", receiptImage.getOriginalFilename());
                String imageUrl = fileStorageService.storeFile(receiptImage, "receipts", filename);
                expense.setReceiptImageUrl(imageUrl);
                expense.setReceiptImageKey(filename);
            }

            expense = expenseRepository.save(expense);
            log.info("Created car wash expense: {} for user: {}", expense.getId(), user.getEmail());
            
            return expense;

        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating car wash expense: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create car wash expense", e);
        }
    }

    public List<Expense> getUserExpenses(User user) {
        return expenseRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    public void deleteExpense(UUID expenseId, User user) {
        Expense expense = expenseRepository.findByIdAndUser_Id(expenseId, user.getId());
        if (expense == null) {
            throw new IllegalArgumentException("Expense not found or access denied");
        }
        
        // Delete receipt image if exists
        if (expense.getReceiptImageKey() != null) {
            try {
                fileStorageService.deleteFile(expense.getReceiptImageKey());
            } catch (Exception e) {
                log.warn("Failed to delete receipt image {}: {}", expense.getReceiptImageKey(), e.getMessage());
            }
        }
        
        expenseRepository.delete(expense);
        log.info("Deleted expense: {} for user: {}", expenseId, user.getEmail());
    }

    public Expense updateExpense(Expense expense) {
        try {
            return expenseRepository.save(expense);
        } catch (Exception e) {
            log.error("Error updating expense: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update expense", e);
        }
    }
}
