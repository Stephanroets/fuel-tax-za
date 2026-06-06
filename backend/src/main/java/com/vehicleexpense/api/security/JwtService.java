package com.vehicleexpense.api.security;

import com.vehicleexpense.api.enums.OrganizationMode;
import com.vehicleexpense.api.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;

/**
 * JWT Service for token generation and validation
 */
@Slf4j
@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.access-token-expiration:86400000}") // 24 hours default (86400000ms)
    private long accessTokenExpiration;
    
    @Value("${jwt.refresh-token-expiration:604800000}") // 7 days default
    private long refreshTokenExpiration;
    
    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("JWT Config - Access token expiration: {} ms ({} hours)", 
            accessTokenExpiration, accessTokenExpiration / 3600000);
    }
    
    /**
     * Generate access token with user and organization claims
     */
    public String generateAccessToken(
            UUID userId,
            String email,
            UUID organizationId,
            UserRole role,
            OrganizationMode mode
    ) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("email", email);
        extraClaims.put("organizationId", organizationId.toString());
        extraClaims.put("role", role.name());
        extraClaims.put("mode", mode.name());
        
        return buildToken(extraClaims, userId.toString(), accessTokenExpiration);
    }
    
    /**
     * Generate refresh token (minimal claims)
     */
    public String generateRefreshToken(UUID userId) {
        return buildToken(new HashMap<>(), userId.toString(), refreshTokenExpiration);
    }
    
    /**
     * Build JWT token with claims
     */
    private String buildToken(
            Map<String, Object> extraClaims,
            String subject,
            long expiration
    ) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }
    
    /**
     * Extract all claims from token
     */
    public JwtClaims extractClaims(String token) {
        Claims claims = extractAllClaims(token);
        
        return new JwtClaims(
            UUID.fromString(claims.getSubject()),
            claims.get("email", String.class),
            UUID.fromString(claims.get("organizationId", String.class)),
            UserRole.valueOf(claims.get("role", String.class)),
            OrganizationMode.valueOf(claims.get("mode", String.class))
        );
    }
    
    /**
     * Extract user ID from token
     */
    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaim(token, Claims::getSubject));
    }
    
    /**
     * Extract organization ID from token
     */
    public UUID extractOrganizationId(String token) {
        return UUID.fromString(extractClaim(token, 
            claims -> claims.get("organizationId", String.class)));
    }
    
    /**
     * Extract role from token
     */
    public UserRole extractRole(String token) {
        return UserRole.valueOf(extractClaim(token, 
            claims -> claims.get("role", String.class)));
    }
    
    /**
     * Check if token is valid (not expired)
     */
    public boolean isTokenValid(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            log.error("Token validation error: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if token is expired
     */
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    /**
     * Extract expiration date from token
     */
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
    
    /**
     * Extract a specific claim using a resolver function
     */
    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }
    
    /**
     * Parse and validate JWT, returning all claims
     */
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    /**
     * Get signing key from secret
     */
    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
