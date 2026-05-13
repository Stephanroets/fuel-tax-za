package com.vehicleexpense.api.service.storage;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * LocalFileStorageService - Dev profile implementation
 * Stores files in local filesystem under the 'uploads/' directory.
 * Accessible via static resource serving.
 */
@Slf4j
@Service
@Profile("dev")
public class LocalFileStorageService implements FileStorageService {

    @Value("${app.storage.local.path:uploads}")
    private String uploadPath;

    @Value("${app.storage.local.base-url:http://localhost:8080/uploads}")
    private String baseUrl;

    private Path storageRoot;

    @PostConstruct
    public void init() {
        try {
            storageRoot = Paths.get(uploadPath).toAbsolutePath().normalize();
            Files.createDirectories(storageRoot);
            log.info("Local file storage initialized at: {}", storageRoot);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file, String directory, String filename) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IOException("Cannot store empty file");
        }

        // Create directory if needed
        Path targetDirectory = storageRoot.resolve(directory).normalize();
        Files.createDirectories(targetDirectory);

        // Resolve target path
        String originalFilename = file.getOriginalFilename();
        String extension = originalFilename != null && originalFilename.contains(".")
            ? originalFilename.substring(originalFilename.lastIndexOf("."))
            : "";
        
        String targetFilename = filename + extension;
        Path targetPath = targetDirectory.resolve(targetFilename);

        // Copy file
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("Stored file locally: {}/{} ({} bytes)", directory, targetFilename, file.getSize());
        
        // Return accessible URL
        return baseUrl + "/" + directory + "/" + targetFilename;
    }

    @Override
    public String storeFile(InputStream inputStream, String contentType, long contentLength,
                            String directory, String filename) throws IOException {
        // Create directory if needed
        Path targetDirectory = storageRoot.resolve(directory).normalize();
        Files.createDirectories(targetDirectory);

        // Resolve target path
        Path targetPath = targetDirectory.resolve(filename);

        // Copy file
        Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);

        log.info("Stored file locally: {}/{} ({} bytes)", directory, filename, contentLength);
        
        return baseUrl + "/" + directory + "/" + filename;
    }

    @Override
    public boolean deleteFile(String storageKey) {
        try {
            // storageKey is relative path like "receipts/filename.jpg"
            Path filePath = storageRoot.resolve(storageKey).normalize();
            
            // Security check: ensure path is within storage root
            if (!filePath.startsWith(storageRoot)) {
                log.warn("Attempted path traversal attack: {}", storageKey);
                return false;
            }
            
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) {
                log.info("Deleted file: {}", storageKey);
            }
            return deleted;
        } catch (IOException e) {
            log.error("Failed to delete file: {}", storageKey, e);
            return false;
        }
    }

    @Override
    public String extractStorageKey(String fileUrl) {
        if (fileUrl == null) {
            return null;
        }
        
        // Extract path after /uploads/
        if (fileUrl.contains("/uploads/")) {
            return fileUrl.substring(fileUrl.indexOf("/uploads/") + "/uploads/".length());
        }
        
        // If it's already a relative path
        return fileUrl;
    }
}
