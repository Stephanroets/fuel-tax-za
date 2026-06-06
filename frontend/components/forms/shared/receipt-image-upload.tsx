'use client'

import { Camera, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatFileSize } from '@/lib/utils/image-converter'

interface ReceiptImageUploadProps {
  previewUrl: string | null
  isCompressing: boolean
  compressionInfo: { originalSize: number; compressedSize: number } | null
  error: string | null
  onCapture: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemove: () => void
  required?: boolean
  title?: string
  accentColor?: string
  altText?: string
}

export function ReceiptImageUpload({
  previewUrl,
  isCompressing,
  compressionInfo,
  error,
  onCapture,
  onRemove,
  required = true,
  title = 'Capture Receipt',
  accentColor = 'sky-500',
  altText = 'Receipt preview',
}: ReceiptImageUploadProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className={`h-5 w-5 text-${accentColor}`} />
          {title}
          {required && (
            <span className="text-destructive text-sm font-normal">(Required)</span>
          )}
          {!required && (
            <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={previewUrl}
                alt={altText}
                className="w-full max-h-48 object-contain rounded-lg bg-muted"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={onRemove}
              >
                Remove
              </Button>
            </div>
            {compressionInfo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>
                  Compressed: {formatFileSize(compressionInfo.originalSize)} → {formatFileSize(compressionInfo.compressedSize)}
                  ({Math.round((1 - compressionInfo.compressedSize / compressionInfo.originalSize) * 100)}% saved)
                </span>
              </div>
            )}
          </div>
        ) : (
          <label className={`
            flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors
            ${error ? 'border-destructive bg-destructive/5' : `border-${accentColor} hover:border-${accentColor}/80 hover:bg-${accentColor}/5`}
          `}>
            {isCompressing ? (
              <>
                <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${accentColor} mb-2`} />
                <span className="text-sm text-muted-foreground">Compressing image...</span>
              </>
            ) : (
              <>
                <Camera className={`h-10 w-10 text-${accentColor} mb-2`} />
                <span className="text-sm font-medium text-foreground">Tap to capture receipt</span>
                <span className="text-xs text-muted-foreground mt-1">Photo will be compressed automatically</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onCapture}
              className="hidden"
              disabled={isCompressing}
            />
          </label>
        )}
        {error && (
          <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
