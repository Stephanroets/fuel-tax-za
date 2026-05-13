package com.vehicleexpense.api.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * SARS Tax Year Opening/Closing Odometer Photo Verification
 * 
 * This entity tracks the mandatory opening (March 1st) and closing (end of February)
 * odometer readings with photo proof for South African tax compliance.
 * 
 * Key features:
 * - Unique constraint prevents overwriting existing readings
 * - GPS coordinates captured at submission time for audit trail
 * - System timestamp ensures photo wasn't taken earlier and submitted later
 * - AVIF format for efficient storage while maintaining quality
 */
@Entity
@Table(
    name = "odometer_verifications",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_odometer_vehicle_year_type",
            columnNames = {"vehicle_id", "tax_year", "reading_type"}
        )
    },
    indexes = {
        @Index(name = "idx_odometer_verifications_organization", columnList = "organization_id"),
        @Index(name = "idx_odometer_verifications_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_odometer_verifications_tax_year", columnList = "tax_year"),
        @Index(name = "idx_odometer_verifications_type", columnList = "reading_type")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OdometerVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "tax_year", nullable = false)
    private Integer taxYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "reading_type", nullable = false, length = 10)
    private OdometerReadingType readingType;

    @Column(name = "odometer_value", nullable = false)
    private Integer odometerValue;

    @Column(name = "image_url_avif", nullable = false, length = 500)
    private String imageUrlAvif;

    @Column(name = "image_key", length = 255)
    private String imageKey;

    // ========================================================================
    // AUDIT METADATA - Critical for SARS compliance
    // ========================================================================

    /**
     * System timestamp at the exact moment of photo capture.
     * This is NOT the upload time - it's the device's current time when
     * the camera shutter was triggered.
     */
    @Column(name = "captured_at", nullable = false)
    private OffsetDateTime capturedAt;

    /**
     * GPS latitude at capture time.
     * Used to verify the reading was taken at the vehicle's location.
     */
    @Column(name = "gps_latitude", precision = 10, scale = 8)
    private BigDecimal gpsLatitude;

    /**
     * GPS longitude at capture time.
     */
    @Column(name = "gps_longitude", precision = 11, scale = 8)
    private BigDecimal gpsLongitude;

    /**
     * GPS accuracy in meters.
     * Helps determine reliability of location data.
     */
    @Column(name = "gps_accuracy_meters", precision = 8, scale = 2)
    private BigDecimal gpsAccuracyMeters;

    /**
     * Device information (browser user agent, app version, etc.)
     */
    @Column(name = "device_info", length = 500)
    private String deviceInfo;

    /**
     * IP address of the submitting client.
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // ========================================================================
    // ENUM
    // ========================================================================

    public enum OdometerReadingType {
        OPENING,  // March 1st reading at start of tax year
        CLOSING   // February 28/29 reading at end of tax year
    }

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    /**
     * Check if we're currently in the valid window for OPENING readings.
     * Opening readings should be submitted in March.
     */
    public static boolean isOpeningWindow() {
        int currentMonth = java.time.LocalDate.now().getMonthValue();
        return currentMonth == 3; // March
    }

    /**
     * Check if we're currently in the valid window for CLOSING readings.
     * Closing readings should be submitted in February.
     */
    public static boolean isClosingWindow() {
        int currentMonth = java.time.LocalDate.now().getMonthValue();
        return currentMonth == 2; // February
    }

    /**
     * Get the current SA tax year.
     * Tax year runs March to February, named by the year it starts.
     * e.g., Tax year 2024 runs from March 2024 to February 2025.
     */
    public static int getCurrentTaxYear() {
        java.time.LocalDate now = java.time.LocalDate.now();
        int month = now.getMonthValue();
        int year = now.getYear();
        // Before March = previous tax year
        return month < 3 ? year - 1 : year;
    }

    /**
     * Validate that the reading can be submitted.
     * - OPENING: Only in March
     * - CLOSING: Only in February
     * - Grace period: Allow submissions up to 7 days outside the window
     */
    public static boolean isValidSubmissionWindow(OdometerReadingType type) {
        int currentMonth = java.time.LocalDate.now().getMonthValue();
        int currentDay = java.time.LocalDate.now().getDayOfMonth();
        
        if (type == OdometerReadingType.OPENING) {
            // March or first week of April
            return currentMonth == 3 || (currentMonth == 4 && currentDay <= 7);
        } else {
            // February or last week of January
            return currentMonth == 2 || (currentMonth == 1 && currentDay >= 24);
        }
    }
}
