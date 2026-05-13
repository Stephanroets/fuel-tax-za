package com.vehicleexpense.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HealthController {

    @GetMapping
    public ResponseEntity<Map<String, Object>> apiRoot() {
        return ResponseEntity.ok(Map.of(
            "service", "vehicle-expense-api",
            "version", "0.0.1-SNAPSHOT",
            "timestamp", LocalDateTime.now(),
            "endpoints", Map.of(
                "health", "/api/v1/health",
                "auth", "/api/v1/auth",
                "vehicles", "/api/v1/vehicles",
                "compliance", "/api/v1/compliance"
            )
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "vehicle-expense-api",
            "timestamp", LocalDateTime.now(),
            "database", "connected"
        ));
    }
}
