package com.vehicleexpense.api.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Tenant Filter Aspect
 * 
 * This aspect ensures that every service method accessing tenant data
 * is filtered by the organization_id from the JWT claims.
 * 
 * It provides a centralized way to:
 * 1. Extract tenant context from security context
 * 2. Validate user has access to requested resource
 * 3. Inject organization_id into repository queries
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class TenantFilterAspect {
    
    private final TenantContext tenantContext;
    
    /**
     * Before any service method, set the tenant context from JWT
     */
    @Before("execution(* com.vehicleexpense.api.services.*.*(..))")
    public void setTenantContext(JoinPoint joinPoint) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof TenantUserPrincipal principal) {
            tenantContext.setCurrentTenant(principal.organizationId());
            tenantContext.setCurrentUser(principal.userId());
            tenantContext.setCurrentRole(principal.role());
            tenantContext.setOrganizationMode(principal.organizationMode());
            
            log.debug("Tenant context set - Org: {}, User: {}, Role: {}", 
                principal.organizationId(), principal.userId(), principal.role());
        }
    }
}

/**
 * Thread-local tenant context holder
 * 
 * Stores the current tenant (organization) context for the request.
 * Used by repositories to automatically filter queries by organization_id.
 */
@Component
@Slf4j
class TenantContext {
    
    private final ThreadLocal<UUID> currentTenant = new ThreadLocal<>();
    private final ThreadLocal<UUID> currentUser = new ThreadLocal<>();
    private final ThreadLocal<UserRole> currentRole = new ThreadLocal<>();
    private final ThreadLocal<OrganizationMode> organizationMode = new ThreadLocal<>();
    
    public void setCurrentTenant(UUID organizationId) {
        currentTenant.set(organizationId);
    }
    
    public UUID getCurrentTenant() {
        return currentTenant.get();
    }
    
    public void setCurrentUser(UUID userId) {
        currentUser.set(userId);
    }
    
    public UUID getCurrentUser() {
        return currentUser.get();
    }
    
    public void setCurrentRole(UserRole role) {
        currentRole.set(role);
    }
    
    public UserRole getCurrentRole() {
        return currentRole.get();
    }
    
    public void setOrganizationMode(OrganizationMode mode) {
        organizationMode.set(mode);
    }
    
    public OrganizationMode getOrganizationMode() {
        return organizationMode.get();
    }
    
    /**
     * Clear context after request completes
     * Called by filter or interceptor
     */
    public void clear() {
        currentTenant.remove();
        currentUser.remove();
        currentRole.remove();
        organizationMode.remove();
        log.debug("Tenant context cleared");
    }
    
    /**
     * Check if user is in solo mode
     */
    public boolean isSoloMode() {
        return organizationMode.get() == OrganizationMode.SOLO;
    }
    
    /**
     * Check if user is admin
     */
    public boolean isAdmin() {
        return currentRole.get() == UserRole.ADMIN;
    }
    
    /**
     * Check if user can view all vehicles/expenses
     * (Admin and Manager can, Driver can only see assigned)
     */
    public boolean canViewAll() {
        UserRole role = currentRole.get();
        return role == UserRole.ADMIN || role == UserRole.MANAGER;
    }
}

/**
 * Example Base Repository with Tenant Filtering
 * 
 * All tenant-scoped repositories should extend this pattern
 * to ensure automatic organization_id filtering.
 */
/*
@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {
    
    // Automatically filtered by organization
    @Query("SELECT v FROM Vehicle v WHERE v.organization.id = :orgId")
    List<Vehicle> findAllByOrganization(@Param("orgId") UUID organizationId);
    
    // For drivers - only assigned vehicles
    @Query("SELECT v FROM Vehicle v WHERE v.organization.id = :orgId AND v.assignedDriver.id = :userId")
    List<Vehicle> findByOrganizationAndAssignedDriver(
        @Param("orgId") UUID organizationId, 
        @Param("userId") UUID userId
    );
    
    // Find by ID with tenant check
    @Query("SELECT v FROM Vehicle v WHERE v.id = :id AND v.organization.id = :orgId")
    Optional<Vehicle> findByIdAndOrganization(
        @Param("id") UUID id, 
        @Param("orgId") UUID organizationId
    );
}
*/
