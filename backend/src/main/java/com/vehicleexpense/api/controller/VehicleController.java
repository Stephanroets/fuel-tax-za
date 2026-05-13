package com.vehicleexpense.api.controller;

import com.vehicleexpense.api.dto.AddVehicleRequest;
import com.vehicleexpense.api.dto.VehicleResponse;
import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    /**
     * GET /api/v1/vehicles
     * Returns all active vehicles for the caller's organisation, each with a
     * compliance flag indicating whether an OPENING odometer reading exists for
     * the current SA tax year.
     */
    @GetMapping
    public ResponseEntity<List<VehicleResponse>> getVehicles(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(vehicleService.getVehicles(user));
    }

    /**
     * POST /api/v1/vehicles
     * Adds a new vehicle to the caller's organisation.
     * Returns 409 Conflict if the registration number already exists in the org.
     */
    @PostMapping
    public ResponseEntity<?> createVehicle(
            @Valid @RequestBody AddVehicleRequest request,
            @AuthenticationPrincipal User user) {
        try {
            VehicleResponse response = vehicleService.createVehicle(request, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(409).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            log.error("Vehicle creation error: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                .body(Map.of("message", "An unexpected error occurred. Check backend logs."));
        }
    }
}
