package com.vehicleexpense.api.repository;

import com.vehicleexpense.api.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {
    List<Expense> findByUser_IdOrderByCreatedAtDesc(UUID userId);
    List<Expense> findByVehicle_IdOrderByExpenseDateDesc(UUID vehicleId);
    List<Expense> findByOrganization_IdOrderByExpenseDateDesc(UUID organizationId);
    Expense findByIdAndUser_Id(UUID id, UUID userId);
}
