package com.vehicleexpense.api.service.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

/**
 * FileStorageService Interface
 * Abstracts file storage operations for both local (dev) and S3 (prod) implementations.
 */
public interface FileStorageService {
    
    /**
     * Store a file and return its URL
     * 
     * @param file the file to store
     * @param directory the directory/category (e.g., "receipts", "odometer-photos")
     * @param filename the desired filename (without extension)
     * @return the full URL to access the file
     * @throws IOException if storage fails
     */
    String storeFile(MultipartFile file, String directory, String filename) throws IOException;
    
    /**
     * Store a file from input stream
     * 
     * @param inputStream the file input stream
     * @param contentType the MIME type
     * @param contentLength the file size
     * @param directory the directory/category
     * @param filename the desired filename
     * @return the full URL to access the file
     * @throws IOException if storage fails
     */
    String storeFile(InputStream inputStream, String contentType, long contentLength, 
                     String directory, String filename) throws IOException;
    
    /**
     * Delete a file by its storage key
     * 
     * @param storageKey the key/path used to identify the file
     * @return true if deletion was successful
     */
    boolean deleteFile(String storageKey);
    
    /**
     * Get the storage key from a URL
     * 
     * @param fileUrl the full URL
     * @return the storage key
     */
    String extractStorageKey(String fileUrl);
    
    /**
     * Generate a unique filename with timestamp
     * 
     * @param prefix optional prefix (e.g., vehicle ID)
     * @param originalFilename the original filename for extension extraction
     * @return a unique filename
     */
    default String generateUniqueFilename(String prefix, String originalFilename) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String extension = "";
        
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        if (prefix != null && !prefix.isEmpty()) {
            return prefix + "_" + timestamp + extension;
        }
        return timestamp + extension;
    }
}
