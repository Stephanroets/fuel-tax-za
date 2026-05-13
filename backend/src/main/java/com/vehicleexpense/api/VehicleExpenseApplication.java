package com.vehicleexpense.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Vehicle Expense API Application
 * 
 * SARS Compliant Vehicle Expense & Tax Compliance System
 * - Multi-tenant architecture (Organizations)
 * - JWT-based authentication
 * - PostgreSQL database
 * - Local/AWS S3 file storage
 * - Console/Brevo email notifications
 */
@SpringBootApplication
@EnableJpaAuditing
public class VehicleExpenseApplication {

    public static void main(String[] args) {
        SpringApplication.run(VehicleExpenseApplication.class, args);
    }
}
