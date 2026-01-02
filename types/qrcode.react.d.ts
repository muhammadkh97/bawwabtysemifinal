<<<<<<< HEAD
declare module 'qrcode.react' {
  import { CSSProperties, Component } from 'react'

  export interface QRCodeProps {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    includeMargin?: boolean
    renderAs?: 'canvas' | 'svg'
    bgColor?: string
    fgColor?: string
    imageSettings?: {
      src: string
      x?: number
      y?: number
      height?: number
      width?: number
      excavate?: boolean
    }
    style?: CSSProperties
    className?: string
  }

  export class QRCodeCanvas extends Component<QRCodeProps> {}
  export class QRCodeSVG extends Component<QRCodeProps> {}

  export default class QRCode extends Component<QRCodeProps> {}
}
=======
declare module 'qrcode.react' {
  import { CSSProperties, Component } from 'react'

  export interface QRCodeProps {
    value: string
    size?: number
    level?: 'L' | 'M' | 'Q' | 'H'
    includeMargin?: boolean
    renderAs?: 'canvas' | 'svg'
    bgColor?: string
    fgColor?: string
    imageSettings?: {
      src: string
      x?: number
      y?: number
      height?: number
      width?: number
      excavate?: boolean
    }
    style?: CSSProperties
    className?: string
  }

  export class QRCodeCanvas extends Component<QRCodeProps> {}
  export class QRCodeSVG extends Component<QRCodeProps> {}

  export default class QRCode extends Component<QRCodeProps> {}
}
>>>>>>> 59cb1431e448110cfe49ca35fb79aa53e9d8b18b
