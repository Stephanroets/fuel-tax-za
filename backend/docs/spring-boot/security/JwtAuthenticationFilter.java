package com.vehicleexpense.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

/**
 * JWT Authentication Filter
 * 
 * Extracts JWT from Authorization header, validates it, and sets the
 * security context with organization_id and user_role from claims.
 * 
 * This is the "JWT Gatekeeper" that ensures tenant isolation.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final JwtService jwtService;
    
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        
        // Check for Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        jwt = authHeader.substring(7);
        
        try {
            // Validate and parse JWT
            if (jwtService.isTokenValid(jwt)) {
                JwtClaims claims = jwtService.extractClaims(jwt);
                
                // Create authentication with role as authority
                List<SimpleGrantedAuthority> authorities = List.of(
                    new SimpleGrantedAuthority("ROLE_" + claims.getRole().name())
                );
                
                // Create custom principal with all claim data
                TenantUserPrincipal principal = new TenantUserPrincipal(
                    claims.getUserId(),
                    claims.getEmail(),
                    claims.getOrganizationId(),
                    claims.getRole(),
                    claims.getOrganizationMode()
                );
                
                UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        authorities
                    );
                
                authToken.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
                );
                
                SecurityContextHolder.getContext().setAuthentication(authToken);
                
                log.debug("Authenticated user: {} for org: {}", 
                    claims.getEmail(), claims.getOrganizationId());
            }
        } catch (Exception e) {
            log.error("JWT validation failed: {}", e.getMessage());
            // Don't set authentication - request will be rejected by security config
        }
        
        filterChain.doFilter(request, response);
    }
}

/**
 * Custom principal that includes tenant information
 */
record TenantUserPrincipal(
    UUID userId,
    String email,
    UUID organizationId,
    UserRole role,
    OrganizationMode organizationMode
) {
    /**
     * Check if user is in solo mode (single-user organization)
     */
    public boolean isSoloMode() {
        return organizationMode == OrganizationMode.SOLO;
    }
    
    /**
     * Check if user is in fleet mode (multi-user organization)
     */
    public boolean isFleetMode() {
        return organizationMode == OrganizationMode.FLEET;
    }
    
    /**
     * Check if user has admin privileges
     */
    public boolean isAdmin() {
        return role == UserRole.ADMIN;
    }
    
    /**
     * Check if user can manage other users
     */
    public boolean canManageUsers() {
        return role == UserRole.ADMIN || role == UserRole.MANAGER;
    }
}

/**
 * JWT Claims extracted from token
 */
record JwtClaims(
    UUID userId,
    String email,
    UUID organizationId,
    UserRole role,
    OrganizationMode organizationMode
) {}

// Enums referenced (would be in separate files)
enum UserRole { ADMIN, MANAGER, DRIVER }
enum OrganizationMode { SOLO, FLEET }
