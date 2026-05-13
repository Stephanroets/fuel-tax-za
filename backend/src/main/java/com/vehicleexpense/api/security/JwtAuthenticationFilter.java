package com.vehicleexpense.api.security;

import com.vehicleexpense.api.entity.User;
import com.vehicleexpense.api.repository.UserRepository;
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
import java.util.Optional;

/**
 * JWT Authentication Filter
 * Validates JWT tokens from Authorization header and sets security context.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        final String authHeader = request.getHeader("Authorization");
        
        // No Authorization header or not a Bearer token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        final String jwt = authHeader.substring(7);
        
        try {
            // Validate token
            if (!jwtService.isTokenValid(jwt)) {
                log.warn("Invalid JWT token from IP: {}", request.getRemoteAddr());
                filterChain.doFilter(request, response);
                return;
            }
            
            // Extract claims
            JwtClaims claims = jwtService.extractClaims(jwt);
            
            // Load User entity from database
            Optional<User> userOpt = userRepository.findByEmail(claims.email());
            if (userOpt.isEmpty()) {
                log.warn("User not found for email: {}", claims.email());
                filterChain.doFilter(request, response);
                return;
            }
            
            User user = userOpt.get();
            
            // Create authentication token with User as principal
            SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + claims.role().name());
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    user,
                    null,
                    List.of(authority)
            );
            
            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
            
            log.debug("Authenticated user: {} with role: {}", user.getEmail(), user.getRole());
            
        } catch (Exception e) {
            log.error("JWT authentication failed: {}", e.getMessage());
            SecurityContextHolder.clearContext();
        }
        
        filterChain.doFilter(request, response);
    }
}
