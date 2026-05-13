"use client"

import { useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Camera, CheckCircle2, Shield } from "lucide-react"
import { apiFormFetch } from "@/lib/api/client"

export default function OdometerCheckPage() {
  const router = useRouter()
  const params = useParams()
  const vehicleId = params.vehicleId as string

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [odometerValue, setOdometerValue] = useState("")
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!odometerValue || parseInt(odometerValue) < 0) {
      setError("Please enter a valid odometer reading")
      return
    }

    setError(null)
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("vehicleId", vehicleId)
      formData.append("readingType", "OPENING")
      formData.append("odometerValue", odometerValue)
      if (photo) formData.append("photo", photo)

      const response = await apiFormFetch("/compliance/odometer", formData)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to save odometer reading")
      }

      // Compliance done — go to dashboard
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = () => {
    // Allow skip during dev — in production this should be blocked
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 pb-24">
      {/* SARS Badge */}
      <Badge variant="outline" className="mb-6 gap-2 px-4 py-2 text-sm border-green-600 text-green-700">
        <Shield className="h-4 w-4" />
        SARS Compliance Required
      </Badge>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Opening Odometer Reading</CardTitle>
          <CardDescription className="text-sm leading-relaxed mt-2">
            South African Tax Law (SARS) requires a timestamped photo of your
            odometer at the <strong>start of each tax year</strong> (1 March) to
            claim vehicle expenses as a tax deduction.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Odometer Reading */}
            <div className="space-y-2">
              <Label htmlFor="odometer">
                Current Odometer Reading (km) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="odometer"
                type="number"
                min={0}
                placeholder="e.g. 45230"
                value={odometerValue}
                onChange={e => setOdometerValue(e.target.value)}
                className="h-12 text-lg"
                required
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label>
                Odometer Photo{" "}
                <span className="text-muted-foreground text-xs">(recommended for SARS audit)</span>
              </Label>

              {photoPreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photoPreview}
                    alt="Odometer"
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-green-600 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Photo added
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute bottom-2 right-2"
                    onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Camera className="h-8 w-8" />
                  <span className="text-sm font-medium">Tap to take / upload photo</span>
                  <span className="text-xs">JPG, PNG or HEIC accepted</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isLoading || !odometerValue}
            >
              {isLoading ? "Saving…" : "✓ Submit & Go to Dashboard"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground text-sm"
              onClick={handleSkip}
            >
              Skip for now (photo required later for SARS compliance)
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="mt-6 text-xs text-muted-foreground text-center max-w-sm">
        Your photo is stored securely. SARS logbook compliance requires this
        photo to verify your opening odometer at the start of each tax year.
      </p>
    </div>
  )
}
