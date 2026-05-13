/**
 * AWS S3 Upload Service
 * 
 * Handles secure image uploads using presigned URLs
 * to avoid exposing AWS credentials on the client.
 */

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  expiresIn: number;
}

interface UploadResult {
  success: boolean;
  fileUrl?: string;
  key?: string;
  error?: string;
}

/**
 * Request a presigned URL from the backend for secure upload
 */
export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
  expenseType: string
): Promise<PresignedUrlResponse> {
  const response = await fetch("/api/uploads/presigned-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      filename,
      contentType,
      expenseType,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to get presigned URL");
  }

  return response.json();
}

/**
 * Upload a file directly to S3 using a presigned URL
 */
export async function uploadToS3(
  blob: Blob,
  presignedUrl: string,
  contentType: string,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Upload failed due to network error"));
    });

    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(blob);
  });
}

/**
 * Complete upload flow: get presigned URL and upload file
 */
export async function uploadExpenseImage(
  blob: Blob,
  filename: string,
  contentType: string,
  expenseType: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Step 1: Get presigned URL from backend
    const presigned = await getPresignedUploadUrl(filename, contentType, expenseType);

    // Step 2: Upload directly to S3
    await uploadToS3(blob, presigned.uploadUrl, contentType, onProgress);

    // Step 3: Return the permanent file URL
    return {
      success: true,
      fileUrl: presigned.fileUrl,
      key: presigned.key,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete an uploaded image
 */
export async function deleteUploadedImage(key: string): Promise<boolean> {
  try {
    const response = await fetch("/api/uploads/delete", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ key }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get a signed URL for viewing a private image
 */
export async function getSignedViewUrl(key: string): Promise<string> {
  const response = await fetch(`/api/uploads/view-url?key=${encodeURIComponent(key)}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get view URL");
  }

  const data = await response.json();
  return data.url;
}
