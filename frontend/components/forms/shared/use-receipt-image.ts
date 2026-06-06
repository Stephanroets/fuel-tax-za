'use client'

import { useState } from 'react'
import {
  processReceiptImage,
  validateImageFile,
} from '@/lib/utils/image-converter'

interface CompressionInfo {
  originalSize: number
  compressedSize: number
}

export function useReceiptImage() {
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null)

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setCompressionInfo(null)

    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setIsCompressing(true)

    try {
      const result = await processReceiptImage(file)

      const compressedFile = new File(
        [result.blob],
        file.name.replace(/\.[^.]+$/, '.avif'),
        { type: result.format }
      )

      setImage(compressedFile)
      setPreviewUrl(URL.createObjectURL(result.blob))
      setCompressionInfo({
        originalSize: result.originalSize,
        compressedSize: result.convertedSize,
      })
    } catch (err) {
      setError('Failed to process image. Please try again.')
      console.error('Image compression error:', err)
    } finally {
      setIsCompressing(false)
    }
  }

  const remove = () => {
    setImage(null)
    setPreviewUrl(null)
    setCompressionInfo(null)
  }

  const requireImage = () => {
    if (!image) {
      setError('Receipt image is required')
      return false
    }
    return true
  }

  return {
    image,
    previewUrl,
    error,
    setError,
    isCompressing,
    compressionInfo,
    handleCapture,
    remove,
    requireImage,
  }
}
