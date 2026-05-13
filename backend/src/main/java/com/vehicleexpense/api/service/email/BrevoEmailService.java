package com.vehicleexpense.api.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * BrevoEmailService - Production profile implementation
 * Sends emails using Brevo (Sendinblue) API.
 * 
 * This is a stub implementation. To fully activate:
 * 1. Add Brevo API key to application-prod.yml
 * 2. Uncomment and implement the Brevo API integration
 */
@Slf4j
@Service
@Profile("prod")
public class BrevoEmailService implements EmailService {

    @Value("${brevo.api-key:}")
    private String apiKey;

    @Value("${brevo.sender-email:noreply@vehicleexpense.co.za}")
    private String senderEmail;

    @Value("${brevo.sender-name:Vehicle Expense Tracker}")
    private String senderName;

    @Override
    public void sendVerificationEmail(String to, String name, String verificationToken) {
        log.info("[STUB] Would send verification email via Brevo to: {}", to);
        // Production: Call Brevo API with template
    }

    @Override
    public void sendPasswordResetEmail(String to, String name, String resetToken) {
        log.info("[STUB] Would send password reset email via Brevo to: {}", to);
        // Production: Call Brevo API with template
    }

    @Override
    public void sendWelcomeEmail(String to, String name, String organizationName) {
        log.info("[STUB] Would send welcome email via Brevo to: {}", to);
        // Production: Call Brevo API with template
    }

    @Override
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> templateData) {
        log.info("[STUB] Would send email via Brevo to: {} with template: {}", to, templateName);
        // Production: Call Brevo API with template
    }
}
