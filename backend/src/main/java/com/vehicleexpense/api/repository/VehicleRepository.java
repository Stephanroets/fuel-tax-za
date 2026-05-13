package com.vehicleexpense.api.repository;

import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    List<Vehicle> findByOrganization_IdAndIsActiveTrueOrderByCreatedAtDesc(UUID organizationId);

    List<Vehicle> findByOrganization_IdAndAssignedDriver_IdAndIsActiveTrueOrderByCreatedAtDesc(UUID organizationId, UUID assignedDriverId);

    List<Vehicle> findByOrganization_IdAndAssignedDriver_IdIsNullAndIsActiveTrueOrderByCreatedAtDesc(UUID organizationId);

    boolean existsByOrganization_IdAndRegistrationNumber(UUID organizationId, String registrationNumber);

    /**
     * Find vehicles by assigned driver using LEFT JOIN FETCH.
     * Returns vehicles even if they don't have odometer verifications yet.
     * Fixes "Phantom Vehicle" bug where INNER JOIN hid cars without verified photos.
     */
    @Query("SELECT DISTINCT v FROM Vehicle v LEFT JOIN FETCH v.odometerVerifications WHERE v.assignedDriver = :user")
    List<Vehicle> findByUser(@Param("user") User user);
}
