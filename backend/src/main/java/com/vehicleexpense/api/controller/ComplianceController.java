package com.vehicleexpense.api.controller;

import com.vehicleexpense.api.entity.OdometerVerification;
import com.vehicleexpense.api.entity.Organization;
import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.entity.Vehicle;
import com.vehicleexpense.api.enums.OdometerReadingType;
import com.vehicleexpense.api.repository.OdometerVerificationRepository;
import com.vehicleexpense.api.repository.OrganizationRepository;
import com.vehicleexpense.api.repository.VehicleRepository;
import com.vehicleexpense.api.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/compliance")
@RequiredArgsConstructor
public class ComplianceController {

    private final VehicleRepository vehicleRepository;
    private final OdometerVerificationRepository odometerVerificationRepository;
    private final OrganizationRepository organizationRepository;
    private final FileStorageService fileStorageService;

    /**
     * SA tax year helper — March–February cycle.
     * Jan/Feb belong to the previous tax year.
     */
    private static int currentTaxYear() {
        LocalDateTime now = LocalDateTime.now();
        return now.getMonthValue() < 3 ? now.getYear() - 1 : now.getYear();
    }

    /**
     * POST /api/v1/compliance/odometer
     *
     * Multipart form parameters:
     *   vehicleId    – UUID string of the vehicle
     *   readingType  – "OPENING" or "CLOSING"
     *   odometerValue – integer km reading
     *   photo        – optional image file
     *
     * Enforces organisation ownership before saving.
     * Updates {@code vehicle.currentOdometer} when the reading type is OPENING.
     */
    @PostMapping(value = "/odometer", consumes = "multipart/form-data")
    public ResponseEntity<?> submitOdometerReading(
            @RequestParam("vehicleId") UUID vehicleId,
            @RequestParam("readingType") String readingType,
            @RequestParam("odometerValue") Integer odometerValue,
            @RequestParam(value = "photo", required = false) MultipartFile photo,
            @AuthenticationPrincipal User user) {
        try {
            Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("Vehicle not found"));

            // Ownership check — vehicle must belong to the caller's organisation
            if (!vehicle.getOrganizationId().equals(user.getOrganizationId())) {
                return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
            }

            OdometerReadingType type = OdometerReadingType.valueOf(readingType.toUpperCase());

            // Persist the photo if one was supplied
            String photoUrl = null;
            if (photo != null && !photo.isEmpty()) {
                String filename = fileStorageService.generateUniqueFilename(
                    vehicleId.toString(), photo.getOriginalFilename());
                photoUrl = fileStorageService.storeFile(photo, "odometer-photos", filename);
            }

            Organization org = organizationRepository.findById(user.getOrganizationId())
                .orElseThrow(() -> new IllegalStateException("Organisation not found"));

            // Check if verification already exists for this vehicle/tax year/reading type
            OdometerVerification existingVerification = odometerVerificationRepository
                .findByVehicle_IdAndReadingTypeAndTaxYear(vehicleId, type, currentTaxYear());

            OdometerVerification verification;
            if (existingVerification != null) {
                // Update existing verification
                existingVerification.setOdometerValue(odometerValue);
                existingVerification.setPhotoUrl(photoUrl);
                existingVerification.setCapturedAt(OffsetDateTime.now());
                existingVerification.setUser(user);
                verification = existingVerification;
                log.info("Updating existing odometer verification: vehicle={} type={}", vehicleId, type);
            } else {
                // Create new verification
                verification = OdometerVerification.builder()
                    .vehicle(vehicle)
                    .organization(org)
                    .user(user)
                    .taxYear(currentTaxYear())
                    .readingType(type)
                    .odometerValue(odometerValue)
                    .photoUrl(photoUrl)
                    .capturedAt(OffsetDateTime.now())
                    .build();
                log.info("Creating new odometer verification: vehicle={} type={}", vehicleId, type);
            }

            odometerVerificationRepository.save(verification);

            // Only update the stored odometer value for an OPENING reading
            if (type == OdometerReadingType.OPENING) {
                vehicle.updateOdometer(odometerValue);
                vehicleRepository.save(vehicle);
            }

            log.info("Odometer verification saved: vehicle={} type={} reading={}",
                vehicleId, type, odometerValue);

            return ResponseEntity.ok(Map.of(
                "message", "Odometer reading recorded successfully",
                "vehicleId", vehicleId,
                "compliant", true
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Odometer verification error: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("message", "Failed to save odometer reading. Check backend logs."));
        }
    }
}
