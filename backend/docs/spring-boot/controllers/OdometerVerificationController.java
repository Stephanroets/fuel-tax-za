package com.vehicleexpense.api.controllers;

import com.vehicleexpense.api.dto.OdometerVerificationDTO;
import com.vehicleexpense.api.entities.OdometerVerification;
import com.vehicleexpense.api.entities.OdometerVerification.OdometerReadingType;
import com.vehicleexpense.api.security.CurrentUser;
import com.vehicleexpense.api.security.TenantFilter;
import com.vehicleexpense.api.services.OdometerVerificationService;
import com.vehicleexpense.api.services.S3Service;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Controller for SARS Tax Year Odometer Verification
 * 
 * Endpoints:
 * - POST /api/v1/odometer-verifications - Submit new reading with photo
 * - GET /api/v1/odometer-verifications/vehicle/{vehicleId} - Get all readings for a vehicle
 * - GET /api/v1/odometer-verifications/status/{vehicleId} - Check if readings exist for current year
 * - GET /api/v1/odometer-verifications/audit/{taxYear} - Get audit report for tax year
 */
@RestController
@RequestMapping("/api/v1/odometer-verifications")
@RequiredArgsConstructor
@Slf4j
@TenantFilter // Ensures all queries filter by organization_id from JWT
public class OdometerVerificationController {

    private final OdometerVerificationService verificationService;
    private final S3Service s3Service;

    // ========================================================================
    // CREATE - Submit new odometer verification
    // ========================================================================

    /**
     * Submit a new odometer reading with photo verification.
     * 
     * Validation:
     * 1. Check if we're in the valid time window (March for OPENING, February for CLOSING)
     * 2. Check if a reading already exists (unique constraint)
     * 3. Validate odometer value is reasonable (not less than last known reading)
     * 4. Upload AVIF image to S3
     * 5. Store verification record with GPS and timestamp metadata
     */
    @PostMapping
    public ResponseEntity<?> submitVerification(
            @CurrentUser UUID userId,
            @CurrentUser UUID organizationId,
            @Valid @RequestBody OdometerVerificationDTO.CreateRequest request,
            @RequestHeader(value = "X-Forwarded-For", required = false) String ipAddress,
            @RequestHeader(value = "User-Agent", required = false) String userAgent
    ) {
        log.info("Odometer verification submission: vehicle={}, type={}, taxYear={}", 
                request.getVehicleId(), request.getReadingType(), request.getTaxYear());

        // 1. Validate submission window
        if (!OdometerVerification.isValidSubmissionWindow(request.getReadingType())) {
            String expectedMonth = request.getReadingType() == OdometerReadingType.OPENING 
                    ? "March" : "February";
            return ResponseEntity.badRequest().body(Map.of(
                "error", "INVALID_SUBMISSION_WINDOW",
                "message", String.format(
                    "%s readings should be submitted in %s. Current submissions are not allowed.",
                    request.getReadingType(), expectedMonth
                )
            ));
        }

        // 2. Check for existing reading (will also be caught by unique constraint)
        if (verificationService.existsForVehicleTaxYearType(
                request.getVehicleId(), request.getTaxYear(), request.getReadingType())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                "error", "READING_ALREADY_EXISTS",
                "message", String.format(
                    "An %s reading has already been submitted for this vehicle in tax year %d. " +
                    "Once submitted, readings cannot be modified for audit compliance.",
                    request.getReadingType(), request.getTaxYear()
                )
            ));
        }

        // 3. Validate odometer value
        Integer lastKnownOdometer = verificationService.getLastKnownOdometer(request.getVehicleId());
        if (lastKnownOdometer != null && request.getOdometerValue() < lastKnownOdometer) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "INVALID_ODOMETER",
                "message", String.format(
                    "Odometer value (%d km) cannot be less than the last known reading (%d km).",
                    request.getOdometerValue(), lastKnownOdometer
                )
            ));
        }

        try {
            // 4. Upload AVIF image to S3
            String imageKey = String.format(
                "odometer-verifications/%s/%d/%s/%s.avif",
                organizationId, request.getTaxYear(), request.getVehicleId(), 
                request.getReadingType().toString().toLowerCase()
            );
            String imageUrl = s3Service.uploadBase64Image(request.getImageBase64(), imageKey);

            // 5. Create verification record
            OdometerVerification verification = verificationService.create(
                    organizationId,
                    userId,
                    request.getVehicleId(),
                    request.getTaxYear(),
                    request.getReadingType(),
                    request.getOdometerValue(),
                    imageUrl,
                    imageKey,
                    request.getCapturedAt(),
                    request.getGpsLatitude(),
                    request.getGpsLongitude(),
                    request.getGpsAccuracyMeters(),
                    userAgent,
                    ipAddress
            );

            log.info("Odometer verification created: id={}", verification.getId());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(OdometerVerificationDTO.fromEntity(verification));

        } catch (Exception e) {
            log.error("Failed to submit odometer verification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "SUBMISSION_FAILED",
                "message", "Failed to submit odometer verification. Please try again."
            ));
        }
    }

    // ========================================================================
    // READ - Get verification status and history
    // ========================================================================

    /**
     * Check the verification status for a vehicle in the current tax year.
     * Used by the dashboard to show the "Tax Alert" banner.
     */
    @GetMapping("/status/{vehicleId}")
    public ResponseEntity<OdometerVerificationDTO.StatusResponse> getStatus(
            @PathVariable UUID vehicleId
    ) {
        int currentTaxYear = OdometerVerification.getCurrentTaxYear();
        
        boolean hasOpening = verificationService.existsForVehicleTaxYearType(
                vehicleId, currentTaxYear, OdometerReadingType.OPENING);
        boolean hasClosing = verificationService.existsForVehicleTaxYearType(
                vehicleId, currentTaxYear, OdometerReadingType.CLOSING);
        
        return ResponseEntity.ok(OdometerVerificationDTO.StatusResponse.builder()
                .vehicleId(vehicleId)
                .taxYear(currentTaxYear)
                .hasOpeningReading(hasOpening)
                .hasClosingReading(hasClosing)
                .isOpeningWindow(OdometerVerification.isOpeningWindow())
                .isClosingWindow(OdometerVerification.isClosingWindow())
                .build());
    }

    /**
     * Get all verifications for a specific vehicle.
     */
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<OdometerVerificationDTO>> getByVehicle(
            @PathVariable UUID vehicleId
    ) {
        List<OdometerVerification> verifications = verificationService.findByVehicle(vehicleId);
        return ResponseEntity.ok(verifications.stream()
                .map(OdometerVerificationDTO::fromEntity)
                .toList());
    }

    /**
     * Get audit report for a specific tax year.
     * Returns all verifications across all vehicles for the organization.
     */
    @GetMapping("/audit/{taxYear}")
    public ResponseEntity<OdometerVerificationDTO.AuditReport> getAuditReport(
            @CurrentUser UUID organizationId,
            @PathVariable int taxYear
    ) {
        List<OdometerVerification> verifications = verificationService
                .findByOrganizationAndTaxYear(organizationId, taxYear);
        
        long totalVehicles = verificationService.countVehiclesInOrganization(organizationId);
        long vehiclesWithOpening = verifications.stream()
                .filter(v -> v.getReadingType() == OdometerReadingType.OPENING)
                .count();
        long vehiclesWithClosing = verifications.stream()
                .filter(v -> v.getReadingType() == OdometerReadingType.CLOSING)
                .count();

        return ResponseEntity.ok(OdometerVerificationDTO.AuditReport.builder()
                .taxYear(taxYear)
                .totalVehicles((int) totalVehicles)
                .vehiclesWithOpeningReading((int) vehiclesWithOpening)
                .vehiclesWithClosingReading((int) vehiclesWithClosing)
                .verifications(verifications.stream()
                        .map(OdometerVerificationDTO::fromEntity)
                        .toList())
                .build());
    }
}

// ============================================================================
// DTO Classes
// ============================================================================

class OdometerVerificationDTO {

    @lombok.Data
    @lombok.Builder
    public static class CreateRequest {
        private UUID vehicleId;
        private int taxYear;
        private OdometerReadingType readingType;
        private int odometerValue;
        private String imageBase64; // Base64 encoded AVIF image
        private java.time.OffsetDateTime capturedAt;
        private java.math.BigDecimal gpsLatitude;
        private java.math.BigDecimal gpsLongitude;
        private java.math.BigDecimal gpsAccuracyMeters;
    }

    @lombok.Data
    @lombok.Builder
    public static class StatusResponse {
        private UUID vehicleId;
        private int taxYear;
        private boolean hasOpeningReading;
        private boolean hasClosingReading;
        private boolean isOpeningWindow;
        private boolean isClosingWindow;
    }

    @lombok.Data
    @lombok.Builder
    public static class AuditReport {
        private int taxYear;
        private int totalVehicles;
        private int vehiclesWithOpeningReading;
        private int vehiclesWithClosingReading;
        private List<OdometerVerificationDTO> verifications;
    }

    // Full DTO
    @lombok.Data
    @lombok.Builder
    public static class Response {
        private UUID id;
        private UUID vehicleId;
        private String vehicleRegistration;
        private int taxYear;
        private OdometerReadingType readingType;
        private int odometerValue;
        private String imageUrlAvif;
        private java.time.OffsetDateTime capturedAt;
        private java.math.BigDecimal gpsLatitude;
        private java.math.BigDecimal gpsLongitude;
        private java.time.OffsetDateTime createdAt;
    }

    public static Response fromEntity(OdometerVerification entity) {
        return Response.builder()
                .id(entity.getId())
                .vehicleId(entity.getVehicle().getId())
                .vehicleRegistration(entity.getVehicle().getRegistrationNumber())
                .taxYear(entity.getTaxYear())
                .readingType(entity.getReadingType())
                .odometerValue(entity.getOdometerValue())
                .imageUrlAvif(entity.getImageUrlAvif())
                .capturedAt(entity.getCapturedAt())
                .gpsLatitude(entity.getGpsLatitude())
                .gpsLongitude(entity.getGpsLongitude())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
