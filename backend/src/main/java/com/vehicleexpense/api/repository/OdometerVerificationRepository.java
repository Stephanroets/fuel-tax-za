package com.vehicleexpense.api.repository;

import com.vehicleexpense.api.entity.OdometerVerification;
import com.vehicleexpense.api.enums.OdometerReadingType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OdometerVerificationRepository extends JpaRepository<OdometerVerification, UUID> {

    boolean existsByVehicle_IdAndReadingTypeAndTaxYear(UUID vehicleId, OdometerReadingType readingType, int taxYear);

    OdometerVerification findByVehicle_IdAndReadingTypeAndTaxYear(UUID vehicleId, OdometerReadingType readingType, int taxYear);
}
