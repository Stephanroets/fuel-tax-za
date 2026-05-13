package com.vehicleexpense.api.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;

/**
 * S3FileStorageService - Production profile implementation
 * Stores files in AWS S3 bucket.
 * 
 * This is a stub implementation. To fully activate:
 * 1. Add AWS credentials to application-prod.yml
 * 2. Uncomment and configure the S3Client bean
 */
@Slf4j
@Service
@Profile("prod")
public class S3FileStorageService implements FileStorageService {

    @Value("${aws.s3.bucket-name}")
    private String bucketName;

    @Value("${aws.s3.region}")
    private String region;

    @Value("${aws.cloudfront.domain:}")
    private String cloudfrontDomain;

    // Uncomment when AWS S3 is fully configured
    // private final S3Client s3Client;

    // public S3FileStorageService(S3Client s3Client) {
    //     this.s3Client = s3Client;
    // }

    @Override
    public String storeFile(MultipartFile file, String directory, String filename) throws IOException {
        // Stub: In production, upload to S3
        String storageKey = directory + "/" + filename;
        log.info("[STUB] Would store file in S3: {}/{}", bucketName, storageKey);
        
        // Production implementation would be:
        // s3Client.putObject(PutObjectRequest.builder()
        //     .bucket(bucketName)
        //     .key(storageKey)
        //     .contentType(file.getContentType())
        //     .build(),
        //     RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
        
        return buildFileUrl(storageKey);
    }

    @Override
    public String storeFile(InputStream inputStream, String contentType, long contentLength,
                            String directory, String filename) throws IOException {
        String storageKey = directory + "/" + filename;
        log.info("[STUB] Would store file in S3: {}/{}", bucketName, storageKey);
        
        // Production implementation would be:
        // s3Client.putObject(PutObjectRequest.builder()
        //     .bucket(bucketName)
        //     .key(storageKey)
        //     .contentType(contentType)
        //     .build(),
        //     RequestBody.fromInputStream(inputStream, contentLength));
        
        return buildFileUrl(storageKey);
    }

    @Override
    public boolean deleteFile(String storageKey) {
        log.info("[STUB] Would delete file from S3: {}/{}", bucketName, storageKey);
        
        // Production implementation would be:
        // s3Client.deleteObject(DeleteObjectRequest.builder()
        //     .bucket(bucketName)
        //     .key(storageKey)
        //     .build());
        
        return true;
    }

    @Override
    public String extractStorageKey(String fileUrl) {
        if (fileUrl == null) {
            return null;
        }
        
        // Extract key from S3 URL or CloudFront URL
        if (fileUrl.contains(bucketName + ".s3.")) {
            int keyStart = fileUrl.indexOf(".amazonaws.com/") + ".amazonaws.com/".length();
            return fileUrl.substring(keyStart);
        }
        
        if (!cloudfrontDomain.isEmpty() && fileUrl.contains(cloudfrontDomain)) {
            int keyStart = fileUrl.indexOf(cloudfrontDomain) + cloudfrontDomain.length();
            return fileUrl.substring(keyStart + 1); // +1 for leading slash
        }
        
        return fileUrl;
    }

    private String buildFileUrl(String storageKey) {
        if (!cloudfrontDomain.isEmpty()) {
            return "https://" + cloudfrontDomain + "/" + storageKey;
        }
        return "https://" + bucketName + ".s3." + region + ".amazonaws.com/" + storageKey;
    }
}
