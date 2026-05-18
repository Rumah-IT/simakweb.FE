declare module "@/components/Silk" {
  import { FC } from "react"

  interface SilkProps {
    speed?: number
    scale?: number
    color?: string
    noiseIntensity?: number
    rotation?: number
    [key: string]: any
  }

  const Silk: FC<SilkProps>
  export default Silk
}
