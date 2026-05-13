package com.vehicleexpense.api.enums;

/**
 * Odometer Reading Type Enum - Matches PostgreSQL odometer_reading_type type
 * SARS Tax Year compliance
 */
public enum OdometerReadingType {
    OPENING,   // March 1st reading at start of tax year
    CLOSING    // February 28/29 reading at end of tax year
}
