package com.vehicleexpense.api.service;

import com.vehicleexpense.api.dto.AddVehicleRequest;
import com.vehicleexpense.api.dto.VehicleResponse;
import com.vehicleexpense.api.entity.Organization;
import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.entity.Vehicle;
import com.vehicleexpense.api.enums.OdometerReadingType;
import com.vehicleexpense.api.enums.OrganizationMode;
import com.vehicleexpense.api.repository.OdometerVerificationRepository;
import com.vehicleexpense.api.repository.OrganizationRepository;
import com.vehicleexpense.api.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final OdometerVerificationRepository odometerVerificationRepository;
    private final OrganizationRepository organizationRepository;

    /**
     * SA tax year: March–February. Returns the year in which the tax year starts.
     * e.g. March 2024 – February 2025 → tax year 2024.
     * If the current month is Jan or Feb we are still inside the previous tax year.
     */
    private static int currentTaxYear() {
        LocalDateTime now = LocalDateTime.now();
        return now.getMonthValue() < 3 ? now.getYear() - 1 : now.getYear();
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> getVehicles(User user) {
        // For SOLO organizations, return vehicles assigned to the user OR unassigned vehicles
        // For FLEET organizations, return all vehicles in the organization
        List<Vehicle> vehicles;
        if (user.getOrganization().getMode() == OrganizationMode.SOLO) {
            // Get vehicles assigned to the user
            List<Vehicle> assignedVehicles = vehicleRepository
                .findByOrganization_IdAndAssignedDriver_IdAndIsActiveTrueOrderByCreatedAtDesc(
                    user.getOrganizationId(), user.getId());
            // Get unassigned vehicles (owned by the organization for SOLO accounts)
            List<Vehicle> unassignedVehicles = vehicleRepository
                .findByOrganization_IdAndAssignedDriver_IdIsNullAndIsActiveTrueOrderByCreatedAtDesc(
                    user.getOrganizationId());
            // Combine both lists
            vehicles = new java.util.ArrayList<>(assignedVehicles);
            vehicles.addAll(unassignedVehicles);
        } else {
            vehicles = vehicleRepository
                .findByOrganization_IdAndIsActiveTrueOrderByCreatedAtDesc(user.getOrganizationId());
        }
        
        return vehicles.stream()
            .map(v -> toResponse(v, isCompliant(v.getId())))
            .toList();
    }

    @Transactional
    public VehicleResponse createVehicle(AddVehicleRequest request, User user) {
        if (vehicleRepository.existsByOrganization_IdAndRegistrationNumber(
                user.getOrganizationId(), request.registrationNumber())) {
            throw new IllegalArgumentException(
                "A vehicle with registration " + request.registrationNumber()
                    + " already exists in your organisation");
        }

        Organization org = organizationRepository.findById(user.getOrganizationId())
            .orElseThrow(() -> new IllegalStateException("Organisation not found"));

        Vehicle vehicle = Vehicle.builder()
            .organization(org)
            .nickname(request.nickname())
            .registrationNumber(request.registrationNumber().toUpperCase().trim())
            .make(request.make())
            .model(request.model())
            .year(request.year())
            .fuelType(request.fuelType())
            .color(request.color())
            .currentOdometer(0)
            .isActive(true)
            .assignedDriver(org.getMode() == OrganizationMode.SOLO ? user : null)
            .build();

        vehicleRepository.save(vehicle);
        log.info("Vehicle created: {} {} for org {}",
            vehicle.getMake(), vehicle.getRegistrationNumber(), user.getOrganizationId());

        return toResponse(vehicle, false); // always non-compliant on creation
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private boolean isCompliant(UUID vehicleId) {
        return odometerVerificationRepository.existsByVehicle_IdAndReadingTypeAndTaxYear(
            vehicleId, OdometerReadingType.OPENING, currentTaxYear());
    }

    private VehicleResponse toResponse(Vehicle v, boolean compliant) {
        return new VehicleResponse(
            v.getId(),
            v.getNickname(),
            v.getRegistrationNumber(),
            v.getMake(),
            v.getModel(),
            v.getYear(),
            v.getColor(),
            v.getFuelType(),
            v.getFuelType().getDisplayName(),
            v.getCurrentOdometer(),
            compliant
        );
    }
}
