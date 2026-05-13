package com.vehicleexpense.api.service.email;

import java.util.Map;

/**
 * EmailService Interface
 * Abstracts email sending for both console logging (dev) and actual sending (prod).
 */
public interface EmailService {
    
    /**
     * Send a verification email to a new user
     * 
     * @param to the recipient email address
     * @param name the recipient name
     * @param verificationToken the token for email verification
     */
    void sendVerificationEmail(String to, String name, String verificationToken);
    
    /**
     * Send a password reset email
     * 
     * @param to the recipient email address
     * @param name the recipient name
     * @param resetToken the password reset token
     */
    void sendPasswordResetEmail(String to, String name, String resetToken);
    
    /**
     * Send a welcome email after successful verification
     * 
     * @param to the recipient email address
     * @param name the recipient name
     * @param organizationName the organization name
     */
    void sendWelcomeEmail(String to, String name, String organizationName);
    
    /**
     * Send a generic email
     * 
     * @param to the recipient email address
     * @param subject the email subject
     * @param templateName the template name
     * @param templateData the template variables
     */
    void sendEmail(String to, String subject, String templateName, Map<String, Object> templateData);
}
