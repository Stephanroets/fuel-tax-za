package com.vehicleexpense.api.enums;

/**
 * User Role Enum - Matches PostgreSQL user_role type
 * ADMIN: Full organization access
 * MANAGER: View all, manage subset
 * DRIVER: Limited to assigned vehicles
 */
public enum UserRole {
    ADMIN,
    MANAGER,
    DRIVER
}
