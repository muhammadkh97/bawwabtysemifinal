<<<<<<< HEAD
declare module 'html5-qrcode' {
  export interface CameraDevice {
    id: string
    label: string
  }

  export interface Html5QrcodeConfig {
    fps?: number
    qrbox?: { width: number; height: number } | number
    aspectRatio?: number
    disableFlip?: boolean
    videoConstraints?: MediaTrackConstraints
  }

  export interface Html5QrcodeScannerConfig extends Html5QrcodeConfig {
    rememberLastUsedCamera?: boolean
    supportedScanTypes?: Array<'SCAN_TYPE_CAMERA' | 'SCAN_TYPE_FILE'>
  }

  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean)

    static getCameras(): Promise<CameraDevice[]>

    start(
      cameraIdOrConfig: string | MediaTrackConstraints,
      configuration: Html5QrcodeConfig | undefined,
      qrCodeSuccessCallback: (decodedText: string, result: any) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: any) => void
    ): Promise<void>

    stop(): Promise<void>

    clear(): Promise<void>

    getState(): number

    pause(shouldPauseVideo?: boolean): void

    resume(): void
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: Html5QrcodeScannerConfig | undefined,
      verbose?: boolean
    )

    render(
      qrCodeSuccessCallback: (decodedText: string, result: any) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): void

    clear(): Promise<void>

    getState(): number
  }
}
=======
declare module 'html5-qrcode' {
  export interface CameraDevice {
    id: string
    label: string
  }

  export interface Html5QrcodeConfig {
    fps?: number
    qrbox?: { width: number; height: number } | number
    aspectRatio?: number
    disableFlip?: boolean
    videoConstraints?: MediaTrackConstraints
  }

  export interface Html5QrcodeScannerConfig extends Html5QrcodeConfig {
    rememberLastUsedCamera?: boolean
    supportedScanTypes?: Array<'SCAN_TYPE_CAMERA' | 'SCAN_TYPE_FILE'>
  }

  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean)

    static getCameras(): Promise<CameraDevice[]>

    start(
      cameraIdOrConfig: string | MediaTrackConstraints,
      configuration: Html5QrcodeConfig | undefined,
      qrCodeSuccessCallback: (decodedText: string, result: any) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: any) => void
    ): Promise<void>

    stop(): Promise<void>

    clear(): Promise<void>

    getState(): number

    pause(shouldPauseVideo?: boolean): void

    resume(): void
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: Html5QrcodeScannerConfig | undefined,
      verbose?: boolean
    )

    render(
      qrCodeSuccessCallback: (decodedText: string, result: any) => void,
      qrCodeErrorCallback?: (errorMessage: string) => void
    ): void

    clear(): Promise<void>

    getState(): number
  }
}
>>>>>>> 59cb1431e448110cfe49ca35fb79aa53e9d8b18b
