package com.vehicleexpense.api.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.vehicleexpense.api.enums.OdometerReadingType;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * OdometerVerification Entity - SARS Tax Year Compliance
 *
 * South African tax law requires opening (March 1st) and closing (Feb 28/29th)
 * odometer readings with photo proof for vehicle logbook compliance.
 *
 * Unique constraint ensures only one OPENING and one CLOSING per vehicle per tax year.
 */
@Entity
@Table(
    name = "odometer_verifications",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_odometer_vehicle_year_type",
            columnNames = { "vehicle_id", "tax_year", "reading_type" }
        ),
    },
    indexes = {
        @Index(name = "idx_odometer_org", columnList = "organization_id"),
        @Index(name = "idx_odometer_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_odometer_tax_year", columnList = "tax_year"),
        @Index(name = "idx_odometer_type", columnList = "reading_type"),
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

    /**
     * Many Verifications belong to one Organization
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "organization_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_odometer_organization")
    )
    @JsonBackReference
    private Organization organization;

    /**
     * Many Verifications belong to one Vehicle
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "vehicle_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_odometer_vehicle")
    )
    @JsonBackReference("vehicle-verifications")
    private Vehicle vehicle;

    /**
     * Many Verifications are captured by one User
     * OWNING side - @JsonBackReference prevents recursion
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "user_id",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_odometer_user")
    )
    @JsonBackReference("user-verifications")
    private User user;

    @Column(name = "tax_year", nullable = false)
    private Integer taxYear;

    @Enumerated(EnumType.STRING)
    @Column(name = "reading_type", nullable = false)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private OdometerReadingType readingType;

    @Column(name = "odometer_value", nullable = false)
    private Integer odometerValue;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    @Column(name = "photo_key", length = 255)
    private String photoKey;

    /**
     * System timestamp at the exact moment of photo capture/submission.
     */
    @Column(name = "captured_at", nullable = false)
    private OffsetDateTime capturedAt;

    /**
     * GPS coordinates at capture time (optional but recommended for audit)
     */
    @Column(name = "gps_latitude", precision = 10, scale = 8)
    private BigDecimal gpsLatitude;

    @Column(name = "gps_longitude", precision = 11, scale = 8)
    private BigDecimal gpsLongitude;

    /**
     * Device information (browser user agent, app version, etc.)
     */
    @Column(name = "device_info", length = 500)
    private String deviceInfo;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    // ========================================================================
    // HELPER METHODS
    // ========================================================================

    public UUID getOrganizationId() {
        return organization != null ? organization.getId() : null;
    }

    public UUID getVehicleId() {
        return vehicle != null ? vehicle.getId() : null;
    }

    public UUID getUserId() {
        return user != null ? user.getId() : null;
    }

    public boolean isOpening() {
        return readingType == OdometerReadingType.OPENING;
    }

    public boolean isClosing() {
        return readingType == OdometerReadingType.CLOSING;
    }

    /**
     * Get the current SA tax year.
     * Tax year runs March to February, named by the year it starts.
     * e.g., Tax year 2024 runs from March 2024 to February 2025.
     */
    public static int getCurrentTaxYear() {
        LocalDateTime now = LocalDateTime.now();
        int month = now.getMonthValue();
        int year = now.getYear();
        // Before March = previous tax year
        return month < 3 ? year - 1 : year;
    }

    /**
     * Check if this reading is valid for the current submission window.
     * - OPENING: Submitted in March
     * - CLOSING: Submitted in February
     */
    public static boolean isValidSubmissionWindow(OdometerReadingType type) {
        int currentMonth = LocalDateTime.now().getMonthValue();

        if (type == OdometerReadingType.OPENING) {
            return currentMonth == 3; // March
        } else {
            return currentMonth == 2; // February
        }
    }
}
