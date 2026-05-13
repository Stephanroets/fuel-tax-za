package com.vehicleexpense.api.service.email;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * ConsoleEmailService - Dev profile implementation
 * Logs emails to console instead of actually sending them.
 * Useful for local development without SMTP configuration.
 */
@Slf4j
@Service
@Profile("dev")
public class ConsoleEmailService implements EmailService {

    private static final String CONSOLE_DIVIDER = "\n" + "=".repeat(80) + "\n";

    @Override
    public void sendVerificationEmail(String to, String name, String verificationToken) {
        String subject = "Verify Your Email - Vehicle Expense Tracker";
        String verificationLink = "http://localhost:3000/verify-email?token=" + verificationToken;
        
        String body = String.format("""
            Hi %s,
            
            Please verify your email by clicking the link below:
            %s
            
            This link will expire in 24 hours.
            
            If you didn't create an account, please ignore this email.
            
            Best regards,
            Vehicle Expense Tracker Team
            """, name, verificationLink);
        
        logEmail(to, subject, body);
    }

    @Override
    public void sendPasswordResetEmail(String to, String name, String resetToken) {
        String subject = "Password Reset Request - Vehicle Expense Tracker";
        String resetLink = "http://localhost:3000/reset-password?token=" + resetToken;
        
        String body = String.format("""
            Hi %s,
            
            You requested a password reset. Click the link below to set a new password:
            %s
            
            This link will expire in 1 hour.
            
            If you didn't request this, please ignore this email and your password 
            will remain unchanged.
            
            Best regards,
            Vehicle Expense Tracker Team
            """, name, resetLink);
        
        logEmail(to, subject, body);
    }

    @Override
    public void sendWelcomeEmail(String to, String name, String organizationName) {
        String subject = "Welcome to Vehicle Expense Tracker";
        
        String body = String.format("""
            Hi %s,
            
            Welcome to Vehicle Expense Tracker!
            
            Your account has been successfully verified and activated.
            
            Organization: %s
            
            You can now log in and start tracking your vehicle expenses:
            http://localhost:3000/login
            
            Best regards,
            Vehicle Expense Tracker Team
            """, name, organizationName);
        
        logEmail(to, subject, body);
    }

    @Override
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> templateData) {
        StringBuilder body = new StringBuilder();
        body.append("Template: ").append(templateName).append("\n\n");
        body.append("Variables:\n");
        
        for (Map.Entry<String, Object> entry : templateData.entrySet()) {
            body.append("  ").append(entry.getKey()).append(" = ").append(entry.getValue()).append("\n");
        }
        
        logEmail(to, subject, body.toString());
    }
    
    private void logEmail(String to, String subject, String body) {
        log.info(CONSOLE_DIVIDER +
            "EMAIL NOTIFICATION (Console Mode - Dev Profile)\n" +
            "-".repeat(80) + "\n" +
            "To:      {}\n" +
            "Subject: {}\n" +
            "-".repeat(80) + "\n" +
            "{}\n" +
            CONSOLE_DIVIDER,
            to, subject, body);
    }
}
