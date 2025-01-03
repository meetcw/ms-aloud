import clsx from "clsx"
import { AudioLines, PauseCircle, PlayCircle } from "lucide-react"
import React from "react"
import { useAudio } from "react-use"
import { useToast } from "../shadcn/hooks/use-toast"
import { Button } from "../shadcn/ui/button"
import { Slider } from "../shadcn/ui/slider"

function formatTime(time: number) {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

interface AudioPlayerProps extends React.HTMLAttributes<HTMLDivElement> {
    src: string
    showVolume?: boolean
    controls?: boolean
    autoPlay?: boolean
}

const AudioPlayer = React.forwardRef<
    HTMLDivElement,
    AudioPlayerProps
>(({ className, src, showVolume = false, controls = true, autoPlay = false, ...props }, ref) => {
    const { toast } = useToast()
    const [audioElement, audioState, audioControls, audioRef] = useAudio({
        src: src,
        autoPlay: false,
        controls: true,
        className: 'hidden'
    })
    return <div
        className={clsx("h-9 flex items-center gap-2 justify-between", className)}
        ref={ref}
    >
        <AudioLines />
        <div className={clsx('flex relative w-full h-full')}>
            <sub className={clsx('text-gray-500 text-xs absolute left-0')}>{formatTime(audioState.time)}</sub>
            <Slider className={clsx('flex-1')} value={[audioState.time]} max={audioState.duration} step={0.01}
                onValueChange={(value) => {
                    audioControls.seek(value[0])
                }}
            />
            <sub className={clsx('text-gray-500 text-xs absolute right-0')}>{formatTime(audioState.duration)}</sub>
        </div>
        <Button
            className={clsx('px-1.5 py-1 [&_svg]:size-5')}
            variant={'ghost'}
            onClick={() => {
                try {
                    if (audioState.paused) {
                        audioControls.play()
                    } else {
                        audioControls.pause()
                    }
                } catch (error) {
                    toast({
                        title: 'Error',
                        description: 'Failed to play audio',
                        variant: 'destructive'
                    })
                }

            }}>
            {audioState.paused ?
                <PlayCircle></PlayCircle> :
                <PauseCircle></PauseCircle>
            }
        </Button>

        {audioElement}
    </div>
})
AudioPlayer.displayName = "AudioPlayer"

export { AudioPlayer }

