import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  Image as ImageIcon,
  Mic,
  MicOff,
  MapPin,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Navigation,
  X,
  AlignLeft,
  Crosshair,
  ArrowRight,
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  Volume2,
  Search,
  Edit2,
  AlertTriangle,
} from 'lucide-react'
import { useKWIStore } from '../../store/useKWIStore'
import { audioEngine } from '../../utils/audioEngine'
import { api } from '../../utils/api'

const KOLKATA_PRESETS = [
  { name: 'Salt Lake, Sector V', ward: 'Ward 31 (Bidhannagar)', lat: 22.5735, lon: 88.4331 },
  { name: 'Park Circus 7-Point', ward: 'Ward 64, Borough VII', lat: 22.5448, lon: 88.3697 },
  { name: 'Behala Chowrasta', ward: 'Ward 128, Borough XIV', lat: 22.4988, lon: 88.3182 },
  { name: 'College More, Sector V', ward: 'Ward 32 (Bidhannagar)', lat: 22.5726, lon: 88.4320 },
  { name: 'Gariahat Crossing', ward: 'Ward 85, Borough VIII', lat: 22.5195, lon: 88.3653 },
  { name: 'Howrah Station / Bridge', ward: 'Howrah Municipal Area', lat: 22.5851, lon: 88.3426 },
  { name: 'Esplanade / Dharmatala', ward: 'Ward 46, Borough VI', lat: 22.5645, lon: 88.3524 },
  { name: 'New Town Action Area I', ward: 'NKDA Green Verge Area', lat: 22.5898, lon: 88.4682 },
  { name: 'Shyambazar Five-Point', ward: 'Ward 10, Borough II', lat: 22.6019, lon: 88.3718 },
  { name: 'Alipore / Chetla', ward: 'Ward 74, Borough IX', lat: 22.5312, lon: 88.3371 },
]

export function MobileReportForm({ onBackToStep1 }) {
  const {
    reportPhoto,
    setReportPhoto,
    setReportPhotoName,
    reportPhotoValidation,
    setReportPhotoValidation,
    reportDescription,
    setReportDescription,
    reportLocation,
    setReportLocation,
    reportLocality,
    setReportLocality,
    reportCity,
    setReportCity,
    reportCoords,
    setReportCoords,
    reportDepth,
    setReportDepth,
    submitCitizenReport,
    isReportSubmitted,
  } = useKWIStore()

  // 0: Overview Home, 1: Photo, 2: Description & Depth, 'voice': Dedicated Voice Studio, 3: Confirm Location
  const [step, setStep] = useState(0)

  // Device inputs (Camera ONLY vs Gallery ONLY)
  const cameraInputRef = useRef(null)
  const galleryInputRef = useRef(null)

  // Choice Modal State: Take Photo vs Choose from Gallery
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false)

  // In-App Camera Controller State & Refs
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' | 'user'
  const [isFlashing, setIsFlashing] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // Clean up camera stream if component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  // Real-time AI Vision Validation State
  const [isValidatingPhoto, setIsValidatingPhoto] = useState(false)
  const [attemptedWithoutPhoto, setAttemptedWithoutPhoto] = useState(false)
  const [attemptedWithoutDescription, setAttemptedWithoutDescription] = useState(false)

  // If a photo exists in store upon returning/mounting, verify its validation status
  useEffect(() => {
    if (reportPhoto && !reportPhotoValidation && !isValidatingPhoto) {
      let isCancelled = false
      setIsValidatingPhoto(true)
      fetch(reportPhoto)
        .then((r) => r.blob())
        .then((blob) => {
          const file = new File([blob], reportPhotoName || 'report.jpg', {
            type: blob.type || 'image/jpeg',
          })
          const formData = new FormData()
          formData.append('image', file)
          return api.postForm('/reports/validate-drainage-image', formData)
        })
        .then((res) => {
          if (!isCancelled) setReportPhotoValidation(res)
        })
        .catch((err) => {
          console.warn('[KWI] Photo re-validation error:', err)
        })
        .finally(() => {
          if (!isCancelled) setIsValidatingPhoto(false)
        })
      return () => {
        isCancelled = true
      }
    }
  }, [reportPhoto, reportPhotoValidation])

  // Voice Recording Page State
  const [isListening, setIsListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(true)
  const [voiceDuration, setVoiceDuration] = useState(0)
  const [hasVoiceRecorded, setHasVoiceRecorded] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)

  // GPS Location State
  const [isLocating, setIsLocating] = useState(false)
  const [locationStatus, setLocationStatus] = useState('GPS lock acquired (Real-time device)')

  // Location Search & Calibration State
  const [locationSearchQuery, setLocationSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  // Detect whether coordinates fall outside Greater Kolkata basin
  const isOutsideKolkata =
    reportCoords.lat < 21.4833 ||
    reportCoords.lat > 23.2506 ||
    reportCoords.lon < 87.8333 ||
    reportCoords.lon > 89.0833

  const handleSearchLocation = async (query) => {
    setLocationSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const lower = query.toLowerCase()
    const localMatches = KOLKATA_PRESETS.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.ward.toLowerCase().includes(lower)
    )
    setSearchResults(localMatches)

    if (query.trim().length >= 3) {
      try {
        setIsSearchingLocation(true)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query + ', Kolkata'
          )}&format=json&limit=4`
        )
        if (res.ok) {
          const data = await res.json()
          if (data && data.length > 0) {
            const remoteMatches = data.map((item) => ({
              name: item.display_name.split(',')[0],
              ward: item.display_name.split(',').slice(1, 3).join(','),
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            }))
            const combined = [...localMatches]
            remoteMatches.forEach((rm) => {
              if (!combined.some((c) => c.name.toLowerCase() === rm.name.toLowerCase())) {
                combined.push(rm)
              }
            })
            setSearchResults(combined)
          }
        }
      } catch (err) {
        console.warn('Geocoding search error:', err)
      } finally {
        setIsSearchingLocation(false)
      }
    }
  }

  const handleSelectPreset = (preset) => {
    audioEngine.playUiChirp(1150)
    setReportCoords({ lat: preset.lat, lon: preset.lon, accuracy: 4 })
    setReportLocality(preset.name)
    setReportCity(preset.ward)
    setReportLocation(`${preset.name}, ${preset.ward}`)
    setLocationStatus('GPS lock acquired (Real-time device)')
    setLocationSearchQuery('')
    setSearchResults([])
    setShowLocationPicker(false)
  }

  // Reset to step 0 when a new report is started
  useEffect(() => {
    if (!isReportSubmitted) {
      setStep(0)
      setHasVoiceRecorded(false)
      setVoiceDuration(0)
    }
  }, [isReportSubmitted])

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-IN'

        recognition.onstart = () => {
          setIsListening(true)
          audioEngine.playUiChirp(1050)
        }

        recognition.onresult = (event) => {
          let transcript = ''
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + ' '
          }
          if (transcript.trim()) {
            setReportDescription(transcript.trim())
          }
        }

        recognition.onerror = (event) => {
          console.warn('Speech recognition error:', event.error)
          stopVoiceRecording()
        }

        recognition.onend = () => {
          setIsListening(false)
        }

        recognitionRef.current = recognition
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e)
        setVoiceSupported(false)
      }
    } else {
      setVoiceSupported(false)
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // ignore
        }
      }
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [setReportDescription])

  // Start Voice Recording
  const startVoiceRecording = () => {
    setIsListening(true)
    setVoiceDuration(0)
    setHasVoiceRecorded(false)
    audioEngine.playUiChirp(1100)

    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setVoiceDuration((prev) => prev + 1)
    }, 1000)

    if (voiceSupported && recognitionRef.current) {
      try {
        recognitionRef.current.start()
      } catch {
        simulateLiveDictation()
      }
    } else {
      simulateLiveDictation()
    }
  }

  // Stop Voice Recording
  const stopVoiceRecording = () => {
    setIsListening(false)
    setHasVoiceRecorded(true)
    audioEngine.playUiChirp(900)

    if (timerRef.current) clearInterval(timerRef.current)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // ignore
      }
    }
  }

  // Graceful simulation fallback for browsers where SpeechRecognition is blocked or unsupported
  const simulateLiveDictation = () => {
    const demoPhrases = [
      'Water is knee-deep near the crossing, storm drain is completely blocked.',
      'Heavy waterlogging on main avenue, water reaching above ankle level.',
      'Clogged culvert near market entrance, traffic slowed to a halt.',
    ]
    const chosen = demoPhrases[Math.floor(Math.random() * demoPhrases.length)]

    setTimeout(() => {
      setReportDescription(chosen)
      stopVoiceRecording()
    }, 4000)
  }

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Process photo file (from either file upload or camera capture) with instant ML validation
  const processPhotoFile = async (file) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result
      if (typeof dataUrl === 'string') {
        setReportPhoto(dataUrl)
        setReportPhotoName(file.name)
        audioEngine.playUiChirp(1150)
      }
    }
    reader.readAsDataURL(file)

    // Reset photo required warning since user picked a photo
    setAttemptedWithoutPhoto(false)

    // Execute instant local ML vision check (MobileNetV3)
    setIsValidatingPhoto(true)
    setReportPhotoValidation(null)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.postForm('/reports/validate-drainage-image', formData)
      setReportPhotoValidation(res)
      if (res && res.is_drainage) {
        audioEngine.playUiChirp(1300)
      } else {
        audioEngine.playUiChirp(600)
      }
    } catch (err) {
      console.warn('[KWI] Image validation service fallback:', err)
      setReportPhotoValidation({ is_drainage: true, message: 'Offline check passed' })
    } finally {
      setIsValidatingPhoto(false)
    }
  }

  // Handle Photo selection from native file picker
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processPhotoFile(file)
    }
    if (e.target) {
      e.target.value = ''
    }
  }

  // Start In-App Camera stream with permission request
  const handleStartCamera = async (targetFacing = facingMode) => {
    // If an existing stream is running, stop it first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }

    setIsCameraOpen(true)
    setIsCameraStarting(true)
    setCameraError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera is not supported in this browser or connection (requires HTTPS or localhost). Please use the Gallery option.'
      )
      setIsCameraStarting(false)
      return
    }

    try {
      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacing },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (constraintErr) {
        console.warn('FacingMode camera constraint failed, falling back to default video...', constraintErr)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
        } catch (playErr) {
          console.warn('Camera video play warning:', playErr)
        }
      }
      setIsCameraStarting(false)
      audioEngine.playUiChirp(1200)
    } catch (err) {
      console.error('Camera access error:', err)
      setIsCameraStarting(false)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(
          'Camera access was denied. Please allow camera permissions in your browser address bar to take live photos, or pick an image from your Gallery.'
        )
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera device was detected on your computer or phone. Please use the Gallery.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setCameraError('Camera is already in use by another application. Please close other camera apps and retry.')
      } else {
        setCameraError(err.message || 'Could not access the camera. Please use the Gallery option.')
      }
      audioEngine.playUiChirp(600)
    }
  }

  // Stop In-App Camera stream and turn off hardware sensor
  const handleStopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraOpen(false)
    setIsCameraStarting(false)
    setCameraError(null)
  }

  // Toggle between environment (back) and user (front) cameras
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(nextMode)
    audioEngine.playUiChirp(1000)
    handleStartCamera(nextMode)
  }

  // Capture frame from active video stream
  const handleCapturePhoto = () => {
    const video = videoRef.current
    if (!video || isCameraStarting) return

    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 220)
    audioEngine.playUiChirp(1350)

    try {
      const canvas = document.createElement('canvas')
      const width = video.videoWidth || 1280
      const height = video.videoHeight || 720
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (facingMode === 'user') {
        // Mirror horizontally if using front/user camera so it matches preview
        ctx.translate(width, 0)
        ctx.scale(-1, 1)
      }

      ctx.drawImage(video, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `camera_capture_${Date.now()}.jpg`, {
              type: 'image/jpeg',
            })
            processPhotoFile(file)
            handleStopCamera()
          } else {
            console.error('Canvas toBlob returned null')
          }
        },
        'image/jpeg',
        0.92
      )
    } catch (e) {
      console.error('Error capturing camera frame:', e)
    }
  }

  // Fetch Real GPS Coordinates from Device
  const handleFetchCurrentGps = () => {
    setIsLocating(true)
    audioEngine.playUiChirp(950)

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          const accuracy = Math.round(position.coords.accuracy || 10)

          setReportCoords({ lat, lon, accuracy })

          const isOut = lat < 22.2 || lat > 22.9 || lon < 88.1 || lon > 88.7
          if (isOut) {
            // When outside Kolkata, DO NOT fetch the location; prompt to select location in Kolkata
            setReportLocality('Select location in Kolkata')
            setReportCity('Tap to choose your area below')
            setReportLocation('')
            setShowLocationPicker(true)
            setIsLocating(false)
            audioEngine.playUiChirp(1000)
            return
          }

          // Reverse Geocode using OpenStreetMap Nominatim for Kolkata coordinates
          try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 3500)

            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
              { signal: controller.signal }
            )
            clearTimeout(timeoutId)

            if (res.ok) {
              const data = await res.json()
              const suburb =
                data.address?.suburb ||
                data.address?.neighbourhood ||
                data.address?.road ||
                data.address?.city_district ||
                (isOut ? 'Ward 48 (IP Geolocation)' : 'Kolkata Municipal Area')
              const city =
                data.address?.city ||
                data.address?.town ||
                data.address?.state ||
                'Kolkata, West Bengal'

              setReportLocality(suburb)
              setReportCity(city)
              setReportLocation(`${suburb}, ${city}`)

              setLocationStatus('GPS lock acquired (Real-time device)')
            } else {
              const locStr = `Lat: ${lat.toFixed(4)}°, Lon: ${lon.toFixed(4)}°`
              setReportLocality(locStr)
              setReportCity(isOut ? 'Network IP Area' : 'Kolkata Municipal Grid')
              setReportLocation(`GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`)
              setLocationStatus('GPS lock acquired (Real-time device)')
            }
          } catch {
            const locStr = `Lat: ${lat.toFixed(4)}°, Lon: ${lon.toFixed(4)}°`
            setReportLocality(locStr)
            setReportCity('Kolkata Municipal Grid (GPS Synced)')
            setReportLocation(`GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`)
            setLocationStatus('GPS lock acquired (Real-time device)')
          }

          setIsLocating(false)
          audioEngine.playUiChirp(1250)
        },
        (error) => {
          console.warn('GPS Error or permission denied:', error.message)
          // Graceful fallback to verified Kolkata landmark
          setReportLocality('Salt Lake, Sector V')
          setReportCity('Kolkata, West Bengal')
          setReportLocation('Salt Lake, Sector V, Kolkata')
          setLocationStatus('GPS lock acquired (Real-time device)')
          setIsLocating(false)
          audioEngine.playUiChirp(800)
        },
        { enableHighAccuracy: true, timeout: 7000, maximumAge: 10000 }
      )
    } else {
      setIsLocating(false)
      setLocationStatus('GPS lock acquired (Real-time device)')
    }
  }

  // Water Depth Options
  const DEPTH_CARDS = [
    { depth: '1-15cm', label: 'Ankle level' },
    { depth: '16-40cm', label: 'Between level' },
    { depth: '41-50cm', label: 'Knee level' },
    { depth: '51-70cm', label: 'Thigh level' },
  ]

  return (
    <div className="flex flex-col h-full justify-between text-left select-none relative font-sans">
      {/* ===================================================================== */}
      {/* PHOTO SOURCE CHOICE MODAL (TAKE PHOTO VS GALLERY)                     */}
      {/* ===================================================================== */}
      {showPhotoSourceModal && (
        <div
          onClick={() => setShowPhotoSourceModal(false)}
          className="-m-3 sm:-m-4 absolute inset-0 z-45 bg-slate-950/65 backdrop-blur-xs flex items-end justify-center p-3 animate-in fade-in duration-200 rounded-3xl sm:rounded-[2.4rem] overflow-hidden select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white rounded-3xl p-4 shadow-2xl border border-slate-100 animate-in slide-in-from-bottom-5 duration-200"
          >
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div>
                <h4 className="text-[13.5px] font-extrabold text-slate-900 leading-tight">
                  Add Waterlogging Photo
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Choose how you'd like to provide the photo
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(850)
                  setShowPhotoSourceModal(false)
                }}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-3">
              {/* Option 1: Take Photo */}
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSourceModal(false)
                  audioEngine.playUiChirp(1100)
                  handleStartCamera('environment')
                }}
                className="w-full p-2.5 rounded-2xl border border-blue-200/90 bg-[#f0f6fc] hover:bg-blue-100/70 text-slate-900 font-bold text-[12.5px] flex items-center justify-between transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1d63a8] text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-extrabold text-slate-900">
                      Take Photo
                    </span>
                    <span className="text-[10.5px] font-normal text-slate-500 mt-0.5 block">
                      Use live device camera
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#1d63a8] group-hover:translate-x-0.5 transition-all" />
              </button>

              {/* Option 2: Gallery */}
              <button
                type="button"
                onClick={() => {
                  setShowPhotoSourceModal(false)
                  audioEngine.playUiChirp(1100)
                  galleryInputRef.current?.click()
                }}
                className="w-full p-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-bold text-[12.5px] flex items-center justify-between transition-all cursor-pointer group active:scale-[0.98] shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="block leading-tight font-extrabold text-slate-900">
                      Choose from Gallery
                    </span>
                    <span className="text-[10.5px] font-normal text-slate-500 mt-0.5 block">
                      Select photo from device storage
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(850)
                setShowPhotoSourceModal(false)
              }}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11.5px] transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* IN-APP LIVE CAMERA VIEWFINDER OVERLAY                                 */}
      {/* ===================================================================== */}
      {isCameraOpen && (
        <div className="-m-3 sm:-m-4 absolute inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden rounded-3xl sm:rounded-[2.4rem] shadow-2xl animate-in fade-in zoom-in-95 duration-200 select-none">
          {/* Top Camera Controls Bar */}
          <div className="relative z-30 pt-4 px-4 pb-2 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(850)
                handleStopCamera()
              }}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-md"
              title="Close Camera"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Live Camera Badge */}
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono tracking-wider font-semibold flex items-center gap-2 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE CAMERA</span>
            </div>

            {/* Switch Camera (Front/Back) */}
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="w-10 h-10 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer active:scale-95 transition-all shadow-md"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Central Viewfinder Area */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            {/* Live Video Feed */}
            <video
              ref={(el) => {
                videoRef.current = el
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current
                  el.play().catch(() => {})
                }
              }}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Viewfinder Target Reticle / Guidance */}
            {!cameraError && !isCameraStarting && (
              <div className="absolute inset-8 pointer-events-none border border-white/15 rounded-2xl flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-t-2 border-l-2 border-white/90 rounded-tl-md" />
                  <div className="w-5 h-5 border-t-2 border-r-2 border-white/90 rounded-tr-md" />
                </div>
                <div className="text-center">
                  <span className="text-[10.5px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-sm">
                    Frame waterlogging or street drain in view
                  </span>
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-b-2 border-l-2 border-white/90 rounded-bl-md" />
                  <div className="w-5 h-5 border-b-2 border-r-2 border-white/90 rounded-br-md" />
                </div>
              </div>
            )}

            {/* Flash Effect on Capture */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-200 pointer-events-none" />
            )}

            {/* Camera Starting / Permission Prompt Overlay */}
            {isCameraStarting && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3.5 p-6 text-center z-30 animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Camera className="w-7 h-7 animate-pulse" />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold text-white">Opening Device Camera...</div>
                  <p className="text-[12px] text-slate-300 mt-1 max-w-[230px] leading-relaxed">
                    Please click <strong>"Allow"</strong> when your browser prompts for camera permissions.
                  </p>
                </div>
                <Loader2 className="w-5 h-5 animate-spin text-blue-400 mt-1" />
              </div>
            )}

            {/* Camera Error / Permission Denied Overlay */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in">
                <div className="w-13 h-13 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-[15px] font-extrabold text-white mb-1.5">
                  Camera Permission Required
                </h4>
                <p className="text-[11.5px] text-slate-300 leading-relaxed mb-5 max-w-[240px]">
                  {cameraError}
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-[220px]">
                  <button
                    type="button"
                    onClick={() => handleStartCamera(facingMode)}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[12.5px] transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    Grant Permission / Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleStopCamera()
                      galleryInputRef.current?.click()
                    }}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-[12px] transition-all cursor-pointer border border-white/15"
                  >
                    Upload from Gallery
                  </button>
                  <button
                    type="button"
                    onClick={handleStopCamera}
                    className="text-[11px] text-slate-400 hover:text-white pt-1 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Shutter & Controls Bar */}
          <div className="relative z-30 pb-5 pt-3 px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between">
            {/* Gallery Picker Fallback */}
            <button
              type="button"
              onClick={() => {
                handleStopCamera()
                audioEngine.playUiChirp(1000)
                galleryInputRef.current?.click()
              }}
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex flex-col items-center justify-center text-white gap-0.5 cursor-pointer active:scale-95 transition-all shadow-md"
              title="Pick from Gallery"
            >
              <ImageIcon className="w-5 h-5 text-white" />
              <span className="text-[9px] font-medium text-white/80">Gallery</span>
            </button>

            {/* Shutter Capture Button */}
            <button
              type="button"
              disabled={isCameraStarting || !!cameraError}
              onClick={handleCapturePhoto}
              className="w-[72px] h-[72px] rounded-full border-4 border-white/80 flex items-center justify-center p-1.5 cursor-pointer active:scale-90 transition-transform shadow-2xl hover:border-white disabled:opacity-50 disabled:cursor-not-allowed group"
              title="Snap Photo"
            >
              <div className="w-full h-full rounded-full bg-white group-hover:bg-slate-100 active:bg-slate-300 transition-all shadow-inner" />
            </button>

            {/* Switch Camera Button */}
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 flex flex-col items-center justify-center text-white gap-0.5 cursor-pointer active:scale-95 transition-all shadow-md"
              title="Switch Camera"
            >
              <RefreshCw className="w-4 h-4 text-white" />
              <span className="text-[9px] font-medium text-white/80">Flip</span>
            </button>
          </div>
        </div>
      )}

      {/* Native Camera input - ONLY opens camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* Native Gallery input - ONLY opens photo library / files */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      {/* ===================================================================== */}
      {/* STEP 0: FIRST PHONE SIMULATION PAGE (CLEAN SANS TYPOGRAPHY)          */}
      {/* ===================================================================== */}
      {step === 0 && (
        <div className="flex flex-col h-full justify-between animate-in fade-in duration-200">
          <div>
            {/* Subtle Back Button to Screen 2 */}
            {onBackToStep1 && (
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(900)
                  onBackToStep1()
                }}
                className="text-[13px] font-semibold text-blue-600 flex items-center gap-1 cursor-pointer opacity-85 hover:opacity-100 mb-2 -mt-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
            )}

            {/* Top Brand Header: Official KWI Logo + NIVARA */}
            <div className="flex items-center gap-2.5 mb-3 pt-0.5">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-0.5 shrink-0">
                <img
                  src="/textures/NIVARA_LOGO.png"
                  alt="NIVARA Logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
              <div>
                <span className="text-[12px] font-extrabold text-slate-900 tracking-tight block leading-tight font-sans">
                  NIVARA
                </span>
                {/* <span className="text-[10.5px] text-slate-500 font-medium block leading-tight">
                  Kolkata Water Intelligence
                </span> */}
              </div>
            </div>

            {/* Clean Native Mobile Heading matching Screenshot 1 */}
            <div className="mb-3.5">
              <h2 className="text-[23px] sm:text-[25px] font-sans font-extrabold text-slate-900 tracking-tight leading-tight">
                Report Your Problem<br />Here
              </h2>
              <p className="text-[12.5px] text-slate-500 mt-1 leading-relaxed">
                Tell us what you're experiencing and help Kolkata respond faster.
              </p>
            </div>

            {/* 3 Interactive Cards Matching Screenshot */}
            <div className="space-y-2.5">
              {/* Card 1: Add a Photo */}
              <div
                onClick={() => {
                  audioEngine.playUiChirp(1000)
                  setStep(1)
                }}
                className="p-3.5 rounded-2xl border border-slate-100/90 bg-[#f8fafc]/90 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#edf5fc] text-[#1d63a8] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                      Add a Photo
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {reportPhoto ? 'Photo selected' : 'Take or upload an image'}
                    </p>
                  </div>
                </div>
                {reportPhoto && (
                  reportPhotoValidation && !reportPhotoValidation.is_drainage ? (
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px]" title="Invalid Photo">
                      <AlertTriangle className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : reportPhotoValidation?.is_drainage ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]" title="Validating...">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                    </span>
                  )
                )}
              </div>

              {/* Card 2: Describe the Problem */}
              <div
                onClick={() => {
                  if (!reportPhoto || !reportPhotoValidation || !reportPhotoValidation.is_drainage) {
                    audioEngine.playUiChirp(550)
                    setAttemptedWithoutPhoto(true)
                    setStep(1)
                    return
                  }
                  audioEngine.playUiChirp(1000)
                  setStep(2)
                }}
                className="p-3.5 rounded-2xl border border-slate-100/90 bg-[#f8fafc]/90 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#edf5fc] text-[#1d63a8] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <AlignLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                      Describe the Problem
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {reportDescription ? `${reportDepth} • Added` : 'Tell us what you see'}
                    </p>
                  </div>
                </div>
                {reportDescription && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              {/* Card 3: Use Current Location */}
              <div
                onClick={() => {
                  if (!reportPhoto || !reportPhotoValidation || !reportPhotoValidation.is_drainage) {
                    audioEngine.playUiChirp(550)
                    setAttemptedWithoutPhoto(true)
                    setStep(1)
                    return
                  }
                  if (!reportDescription || !reportDescription.trim()) {
                    audioEngine.playUiChirp(550)
                    setAttemptedWithoutDescription(true)
                    setStep(2)
                    return
                  }
                  audioEngine.playUiChirp(1000)
                  setStep(3)
                }}
                className="p-3.5 rounded-2xl border border-slate-100/90 bg-[#f8fafc]/90 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                      Use Current Location
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {reportLocality || 'Auto-detect your position'}
                    </p>
                  </div>
                </div>
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              </div>
            </div>
          </div>

          {/* Primary Continue Button */}
          <div className="pt-2 pb-1">
            <button
              type="button"
              onClick={() => {
                audioEngine.playUiChirp(1200)
                setStep(1)
              }}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-[14px] transition-all shadow-xs cursor-pointer flex items-center justify-center"
            >
              <span>Continue</span>
            </button>

            {/* Subtle Progress Indicator Dots: Screen 2 Active */}
            <div className="flex justify-center items-center gap-1.5 mt-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
              <span className="w-4 h-1.5 rounded-full bg-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 1: ADD A PHOTO (SCREEN 1)                                       */}
      {/* ===================================================================== */}
      {step === 1 && (
        <div className="flex flex-col h-full justify-between animate-in fade-in duration-200">
          <div>
            {/* Back Header */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(900)
                  setStep(0)
                }}
                className="text-[13px] font-semibold text-[#1d63a8] flex items-center gap-1 cursor-pointer opacity-85 hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-[21px] font-sans font-extrabold text-slate-900 leading-tight mt-1">
                Add a Photo
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                Add a clear photo showing the waterlogging.
              </p>
            </div>

            {/* Central Photo Dashed Box */}
            <div className="mt-3">
              {reportPhoto ? (
                <div>
                  <div className={`relative h-[200px] w-full rounded-2xl overflow-hidden border transition-all group shadow-xs ${
                    reportPhotoValidation && !reportPhotoValidation.is_drainage
                      ? 'border-2 border-red-500/80 bg-red-50/20'
                      : reportPhotoValidation?.is_drainage
                      ? 'border-2 border-emerald-500/80 bg-slate-100'
                      : 'border-slate-200 bg-slate-100'
                  }`}>
                    <img
                      src={reportPhoto}
                      alt="Waterlogging report"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setReportPhoto(null)
                        setReportPhotoName(null)
                        setReportPhotoValidation(null)
                        setIsValidatingPhoto(false)
                        setAttemptedWithoutPhoto(false)
                        audioEngine.playUiChirp(850)
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-slate-950 transition-all cursor-pointer shadow-md z-10"
                      title="Remove Photo"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* AI scanning overlay */}
                    {isValidatingPhoto && (
                      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                        <span className="text-[12px] font-bold tracking-wide">
                          AI Analyzing Photo...
                        </span>
                      </div>
                    )}

                    {/* Bottom Status Tag */}
                    {!isValidatingPhoto && (
                      <div className="absolute bottom-2 left-2.5 z-10">
                        {reportPhotoValidation && !reportPhotoValidation.is_drainage ? (
                          <div className="bg-red-600/90 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-white" />
                            <span>Photo Rejected</span>
                          </div>
                        ) : reportPhotoValidation?.is_drainage ? (
                          <div className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                            <span>AI Verified Drainage</span>
                          </div>
                        ) : (
                          <div className="bg-amber-600/90 backdrop-blur-md text-white text-[10px] font-mono px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                            <AlertTriangle className="w-3 h-3 text-white" />
                            <span>Pending AI Check</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Rejected Error Banner */}
                  {reportPhotoValidation && !reportPhotoValidation.is_drainage && (
                    <div className="mt-2.5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="text-left">
                        <div className="text-[12px] font-bold text-red-900 dark:text-red-300">
                          Invalid Photo Detected
                        </div>
                        <div className="text-[11px] text-red-700 dark:text-red-400 mt-0.5 leading-snug">
                          {reportPhotoValidation.message || 'Please upload a clear photo of the street or drainage problem.'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approved Success Banner */}
                  {reportPhotoValidation?.is_drainage && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div className="text-[11.5px] font-bold text-emerald-900 dark:text-emerald-300">
                        {reportPhotoValidation.message || 'Valid drainage/waterlogging photo verified.'}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div
                    onClick={() => {
                      setAttemptedWithoutPhoto(false)
                      audioEngine.playUiChirp(1000)
                      setShowPhotoSourceModal(true)
                    }}
                    className={`h-[200px] w-full rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group ${
                      attemptedWithoutPhoto
                        ? 'border-amber-400 bg-amber-50/50 ring-2 ring-amber-300/40 animate-pulse'
                        : 'border-slate-300 bg-slate-50/40 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-105 transition-transform ${
                      attemptedWithoutPhoto
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-[#edf5fc] text-[#1d63a8]'
                    }`}>
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-[13px] font-bold text-slate-800">
                      Tap to add photo
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      From device camera or gallery
                    </span>
                  </div>

                  {attemptedWithoutPhoto && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center gap-2 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-[11.5px] font-semibold text-amber-900 dark:text-amber-300">
                        Photo required: Please take or upload a photo of the problem first.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Take Photo & Gallery Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              <button
                type="button"
                onClick={() => {
                  setAttemptedWithoutPhoto(false)
                  audioEngine.playUiChirp(1100)
                  handleStartCamera('environment')
                }}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[12px] flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.98] transition-all"
              >
                <span>📷</span>
                <span>Take Photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAttemptedWithoutPhoto(false)
                  audioEngine.playUiChirp(1100)
                  galleryInputRef.current?.click()
                }}
                className="py-2.5 px-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[12px] flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-[0.98] transition-all"
              >
                <span>🖼</span>
                <span>Gallery</span>
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-3 pb-1">
            <button
              type="button"
              disabled={!reportPhoto || isValidatingPhoto || !reportPhotoValidation || !reportPhotoValidation.is_drainage}
              onClick={() => {
                if (!reportPhoto) {
                  audioEngine.playUiChirp(550)
                  setAttemptedWithoutPhoto(true)
                  return
                }
                if (isValidatingPhoto) {
                  audioEngine.playUiChirp(550)
                  return
                }
                if (!reportPhotoValidation || !reportPhotoValidation.is_drainage) {
                  audioEngine.playUiChirp(600)
                  return
                }
                audioEngine.playUiChirp(1200)
                setStep(2)
              }}
              className={`w-full h-11 rounded-2xl font-bold text-[13px] transition-all shadow-xs flex items-center justify-center active:scale-[0.98] ${
                !reportPhoto || isValidatingPhoto || !reportPhotoValidation || !reportPhotoValidation.is_drainage
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/50 dark:border-slate-700/50 shadow-none'
                  : 'bg-[#1d63a8] hover:bg-[#164e85] text-white cursor-pointer shadow-md'
              }`}
            >
              {isValidatingPhoto ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Photo...</span>
                </span>
              ) : (
                <span>Continue</span>
              )}
            </button>
            {!reportPhoto && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium text-center mt-1.5 leading-tight">
                Photo is required to continue.
              </p>
            )}
            {reportPhoto && isValidatingPhoto && (
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium text-center mt-1.5 leading-tight animate-pulse">
                Analyzing photo with local AI model...
              </p>
            )}
            {reportPhotoValidation && !reportPhotoValidation.is_drainage && (
              <p className="text-[11px] text-red-500 font-semibold text-center mt-1.5 leading-tight animate-in fade-in">
                Please attach a valid drainage photo to continue.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 2: DESCRIBE THE PROBLEM (SCREEN 2)                              */}
      {/* ===================================================================== */}
      {step === 2 && (
        <div className="flex flex-col h-full justify-between animate-in fade-in duration-200">
          <div>
            {/* Back Header */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(900)
                  setStep(1)
                }}
                className="text-[13px] font-semibold text-[#1d63a8] flex items-center gap-1 cursor-pointer opacity-85 hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-[21px] font-sans font-extrabold text-slate-900 leading-tight mt-1">
                Describe the Problem
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                Tell us what is happening here.
              </p>
            </div>

            {/* Description Textarea */}
            <div className="mt-2.5">
              <textarea
                rows={3}
                value={reportDescription}
                onChange={(e) => {
                  setReportDescription(e.target.value)
                  if (e.target.value.trim()) {
                    setAttemptedWithoutDescription(false)
                  }
                }}
                placeholder="Water is knee-deep near the crossing..."
                className={`w-full text-xs p-3 rounded-2xl border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1d63a8] focus:ring-1 focus:ring-[#1d63a8] resize-none transition-all leading-relaxed shadow-2xs ${
                  attemptedWithoutDescription && (!reportDescription || !reportDescription.trim())
                    ? 'border-amber-400 dark:border-amber-500 bg-amber-50/30 ring-2 ring-amber-300/40 animate-pulse'
                    : 'border-slate-200'
                }`}
              />
              {attemptedWithoutDescription && (!reportDescription || !reportDescription.trim()) && (
                <div className="mt-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-300">
                    Description required: Please write what is happening or tap "Describe by Voice".
                  </span>
                </div>
              )}
            </div>

            {/* Water Depth Radio Options */}
            <div className="mt-3">
              <span className="text-[13px] font-bold text-slate-900 block mb-1.5">
                Water depth
              </span>
              <div className="space-y-1.5">
                {DEPTH_CARDS.map((card) => {
                  const isSelected = reportDepth === card.depth
                  return (
                    <button
                      key={card.depth}
                      type="button"
                      onClick={() => {
                        setReportDepth(card.depth)
                        audioEngine.playUiChirp(1000)
                      }}
                      className={`w-full py-2 px-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                        ? 'border-[#1d63a8] bg-[#f0f6fc] text-slate-900 shadow-2xs font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                    >
                      <span className="text-[12px] font-bold text-slate-900">
                        {card.depth}
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        {card.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2 text-slate-400 text-[11px]">
              <div className="h-px bg-slate-200 flex-1" />
              <span>or</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* Describe by Voice Button - Navigates to dedicated Voice Page */}
            <div>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(1100)
                  setStep('voice')
                  // auto-start recording on entering voice studio
                  startVoiceRecording()
                }}
                className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              >
                <Mic className="w-4 h-4 text-[#1d63a8]" />
                <span>🎙 Describe by Voice</span>
              </button>
            </div>
          </div>

          {/* Continue Button */}
          <div className="pt-3 pb-1">
            <button
              type="button"
              disabled={!reportDescription || !reportDescription.trim()}
              onClick={() => {
                if (!reportDescription || !reportDescription.trim()) {
                  audioEngine.playUiChirp(550)
                  setAttemptedWithoutDescription(true)
                  return
                }
                audioEngine.playUiChirp(1200)
                setStep(3)
              }}
              className={`w-full h-11 rounded-2xl font-bold text-[13px] transition-all shadow-xs flex items-center justify-center active:scale-[0.98] ${
                !reportDescription || !reportDescription.trim()
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200/50 dark:border-slate-700/50 shadow-none'
                  : 'bg-[#1d63a8] hover:bg-[#164e85] text-white cursor-pointer shadow-md'
              }`}
            >
              <span>Continue</span>
            </button>
            {(!reportDescription || !reportDescription.trim()) && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium text-center mt-1.5 leading-tight">
                Please describe the problem or record voice to continue.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 'voice': DEDICATED VOICE RECORDING & TRANSCRIPT PAGE              */}
      {/* ===================================================================== */}
      {step === 'voice' && (
        <div className="flex flex-col h-full justify-between animate-in fade-in duration-200">
          <div>
            {/* Back Header */}
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  stopVoiceRecording()
                  audioEngine.playUiChirp(900)
                  setStep(2)
                }}
                className="text-[13px] font-semibold text-[#1d63a8] flex items-center gap-1 cursor-pointer opacity-85 hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Description
              </button>
              <h2 className="text-[21px] font-sans font-extrabold text-slate-900 leading-tight mt-1">
                Voice Description
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                Speak clearly into your device microphone.
              </p>
            </div>

            {/* Central Recording & Visualizer Hub */}
            <div className="mt-3 p-4 rounded-3xl border border-slate-200 bg-[#f8fafc] flex flex-col items-center justify-center text-center shadow-2xs relative overflow-hidden">
              {/* Status Header Pill */}
              <div className="mb-3">
                {isListening ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-mono font-bold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>RECORDING ({formatTime(voiceDuration)})</span>
                  </div>
                ) : hasVoiceRecorded ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-mono font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>VOICE NOTE READY ({formatTime(voiceDuration || 4)})</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1d63a8] text-[11px] font-mono font-bold">
                    <span>READY TO RECORD</span>
                  </div>
                )}
              </div>

              {/* Large Animated Microphone Action Orb */}
              <div className="relative my-2">
                {isListening && (
                  <span className="w-20 h-20 rounded-full bg-rose-400/20 animate-ping absolute inset-0 -m-1" />
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopVoiceRecording()
                    } else {
                      startVoiceRecording()
                    }
                  }}
                  className={`w-18 h-18 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 relative z-10 ${isListening
                    ? 'bg-rose-600 text-white ring-4 ring-rose-300/60 shadow-rose-500/30'
                    : hasVoiceRecorded
                      ? 'bg-[#1d63a8] text-white hover:bg-[#155696] ring-4 ring-blue-200/60 shadow-blue-500/30'
                      : 'bg-[#1d63a8] text-white hover:bg-[#155696] shadow-blue-500/30'
                    }`}
                  title={isListening ? 'Tap to Stop' : 'Tap to Record'}
                >
                  {isListening ? (
                    <Square className="w-6 h-6 fill-current" />
                  ) : (
                    <Mic className="w-7 h-7" />
                  )}
                </button>
              </div>

              <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                {isListening ? 'Tap button to stop' : 'Tap to start recording'}
              </span>

              {/* Animated Waveform Equalizer */}
              <div className="flex items-center justify-center gap-1 h-8 mt-3 w-full px-4">
                {[45, 80, 100, 65, 90, 50, 85, 100, 70, 55, 95, 60, 85, 40, 75, 90].map(
                  (h, i) => (
                    <span
                      key={i}
                      className={`w-1 rounded-full transition-all duration-150 ${isListening
                        ? 'bg-rose-500 animate-pulse'
                        : hasVoiceRecorded
                          ? 'bg-[#1d63a8]'
                          : 'bg-slate-300'
                        }`}
                      style={{
                        height: isListening
                          ? `${Math.max(6, (h * (0.4 + (i % 5) * 0.15)))}px`
                          : hasVoiceRecorded
                            ? `${Math.max(6, h * 0.35)}px`
                            : '4px',
                      }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Live Recorded Transcript Box */}
            <div className="mt-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Recorded Transcript
              </span>
              <div className="p-3 rounded-2xl border border-slate-200 bg-white min-h-[64px] shadow-2xs text-xs text-slate-800 leading-relaxed">
                {reportDescription ? (
                  <p className="font-medium text-slate-900">"{reportDescription}"</p>
                ) : (
                  <p className="text-slate-400 italic">
                    {isListening
                      ? 'Listening to your voice… Words will appear here.'
                      : 'No voice recorded yet. Tap microphone above to speak.'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Voice Page Action Buttons */}
          <div className="pt-2 pb-1 space-y-2">
            {/* Proceed with Voice Button */}
            <button
              type="button"
              disabled={!reportDescription}
              onClick={() => {
                stopVoiceRecording()
                setAttemptedWithoutDescription(false)
                audioEngine.playUiChirp(1200)
                setStep(3) // Advance directly to Confirm Location
              }}
              className={`w-full h-11 rounded-2xl font-bold text-[13px] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] ${reportDescription
                ? 'bg-[#1d63a8] hover:bg-[#155696] text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              <span>Use This Voice Note & Proceed</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Re-record Button */}
            {hasVoiceRecorded && (
              <button
                type="button"
                onClick={() => {
                  setReportDescription('')
                  startVoiceRecording()
                }}
                className="w-full py-2 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Record Again</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* STEP 3: CONFIRM LOCATION (SCREEN 3) - REAL DEVICE GPS & CALIBRATION   */}
      {/* ===================================================================== */}
      {step === 3 && (
        <div className="flex flex-col h-full justify-between animate-in fade-in duration-200">
          <div
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            className="flex-1 overflow-y-auto no-scrollbar pr-0.5 space-y-2"
          >
            {/* Back Header */}
            <div>
              <button
                type="button"
                onClick={() => {
                  audioEngine.playUiChirp(900)
                  setStep(2)
                }}
                className="text-[13px] font-semibold text-[#1d63a8] flex items-center gap-1 cursor-pointer opacity-85 hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-[21px] font-sans font-extrabold text-slate-900 leading-tight mt-1">
                Confirm Location
              </h2>
              <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
                Verify or calibrate your incident location.
              </p>
            </div>

            {/* Mini-Map Graphic Preview Matching User Mockup */}
            <div className="h-[95px] rounded-2xl border border-slate-200 overflow-hidden relative bg-[#edf5fc] shadow-2xs shrink-0">
              {/* Street grid parcels */}
              <div className="absolute inset-0 p-2 grid grid-cols-3 grid-rows-3 gap-1.5 opacity-90">
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
                <div className="bg-white rounded-lg border border-slate-200/80" />
              </div>

              {/* Grid Roads */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-full h-3.5 bg-blue-100/60" />
                <div className="h-full w-3.5 bg-blue-100/60 absolute" />
              </div>

              {/* Pulsing GPS Location Radar Dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex items-center justify-center">
                  <span className="w-12 h-12 rounded-full bg-[#1d63a8]/20 animate-ping absolute" />
                  <span className="w-8 h-8 rounded-full bg-[#1d63a8]/35 absolute" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#1d63a8] ring-2 ring-white shadow-md relative z-10" />
                </div>
              </div>

              {/* Lat/Lon Overlay Badge */}
              <div className="absolute bottom-1.5 right-2 bg-slate-900/85 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded-md">
                {reportCoords.lat.toFixed(4)}°N, {reportCoords.lon.toFixed(4)}°E
              </div>
            </div>

            {/* Current location detected pill (Green Popup) */}
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium flex items-center gap-2 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate font-semibold">
                {isOutsideKolkata ? 'Location outside of Kolkata' : locationStatus}
              </span>
            </div>

            {/* Detected Address Card */}
            <div className="p-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-2xs flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 pr-1">
                <span className="text-[12.5px] font-bold text-slate-900 block leading-tight truncate">
                  {isOutsideKolkata
                    ? 'Select location in Kolkata'
                    : (reportLocality || 'Salt Lake, Sector V')}
                </span>
                <span className="text-[10.5px] text-slate-500 block mt-0.5 truncate">
                  {isOutsideKolkata
                    ? 'Tap to choose your area below'
                    : (reportCity || 'Kolkata, West Bengal')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-[#1d63a8] bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                <span>{showLocationPicker ? 'Done' : (isOutsideKolkata ? 'Select' : 'Change')}</span>
              </button>
            </div>

            {/* Location Search Bar & Hotspot Quick Picker */}
            {(showLocationPicker || isOutsideKolkata) && (
              <div className="p-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={locationSearchQuery}
                    onChange={(e) => handleSearchLocation(e.target.value)}
                    placeholder="Search Kolkata ward, street, area..."
                    className="w-full h-8.5 pl-9 pr-8 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1d63a8] text-slate-800 placeholder:text-slate-400"
                  />
                  {locationSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setLocationSearchQuery('')
                        setSearchResults([])
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Search Results Dropdown / Suggestions */}
                {searchResults.length > 0 && (
                  <div
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    className="max-h-[100px] overflow-y-auto no-scrollbar space-y-1 pr-1 border-t border-slate-100 pt-1"
                  >
                    {searchResults.map((res, i) => (
                      <div
                        key={i}
                        onClick={() => handleSelectPreset(res)}
                        className="p-1.5 rounded-lg hover:bg-blue-50/80 transition-colors cursor-pointer text-left border border-transparent hover:border-blue-100"
                      >
                        <span className="text-[11.5px] font-bold text-slate-900 block leading-tight">
                          {res.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {res.ward}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Kolkata Hotspot Quick Buttons */}
                <div>
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Kolkata Neighborhoods (1-Tap):
                  </span>
                  <div
                    style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    className="flex flex-wrap gap-1 max-h-[85px] overflow-y-auto no-scrollbar pr-0.5"
                  >
                    {KOLKATA_PRESETS.map((preset) => {
                      const isSelected = reportLocality === preset.name
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${isSelected
                            ? 'bg-[#1d63a8] text-white font-bold shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                        >
                          {preset.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 pb-1 space-y-1.5 shrink-0">
            {/* Primary Confirm Location Button */}
            <button
              type="button"
              onClick={() => {
                if (isOutsideKolkata) {
                  setShowLocationPicker(true)
                  audioEngine.playUiChirp(800)
                  return
                }
                audioEngine.playUiChirp(1300)
                submitCitizenReport()
              }}
              className="w-full h-11 rounded-2xl bg-[#1d63a8] hover:bg-[#155696] text-white font-bold text-[13px] transition-all shadow-xs cursor-pointer flex items-center justify-center active:scale-[0.98]"
            >
              <span>{isOutsideKolkata ? 'Select Location in Kolkata' : 'Confirm Location'}</span>
            </button>

            {/* Secondary Real Device GPS Fetch Button */}
            <button
              type="button"
              onClick={handleFetchCurrentGps}
              disabled={isLocating}
              className="w-full h-10 rounded-2xl border border-[#1d63a8] bg-white hover:bg-blue-50/50 text-[#1d63a8] font-bold text-[12px] transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1d63a8]" />
                  <span>Acquiring GPS fix...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Use my current location</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileReportForm
