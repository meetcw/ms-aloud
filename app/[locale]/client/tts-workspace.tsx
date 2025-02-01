'use client'
import { useTextToSpeach, useVoice, useVoices } from "@/app/hooks/actions"
import { useToast } from "@/components/shadcn/hooks/use-toast"
import { Button } from "@/components/shadcn/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/shadcn/ui/command"
import { Form, FormField, FormItem, FormMessage } from "@/components/shadcn/ui/form"
import { Label } from "@/components/shadcn/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/shadcn/ui/popover"
import { Slider } from "@/components/shadcn/ui/slider"
import { Textarea } from "@/components/shadcn/ui/textarea"
import { getFirendlyPersonalityName } from "@/service/edge-tts-service/personality-map"
import { getFriendlyVoiceName } from "@/service/edge-tts-service/voice-map"
import { TTSOptions, TTSOptionsSchema } from "@/service/tts-service"
import { zodResolver } from "@hookform/resolvers/zod"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import axios from "axios"
import clsx from "clsx"
import { Check, ChevronsUpDown, LoaderCircle, RotateCw, Smile, Speech } from "lucide-react"
import { HTMLAttributes, useMemo } from "react"
import { useForm } from "react-hook-form"
import { v4 as uuidv4 } from 'uuid'
import { z } from "zod"
import { withClientLayout } from "./layout"
import { useTTSContext } from "./tts-context"

const TTSRequestSchame = z.object({
    options: TTSOptionsSchema,
    text: z.string()
})

export interface TTSWorkspaceProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    locale: string,
    options?: TTSOptions
    text?: string
}

function TTSWorkspace({ locale, ...props }: TTSWorkspaceProps) {
    const { toast } = useToast()

    const voicesQuery = useVoices()

    const groupedVoices = useMemo(() => {
        return voicesQuery.data?.reduce((acc, voice) => {
            acc[voice.locale] = acc[voice.locale] || []
            acc[voice.locale].push(voice)
            return acc
        }, {} as Record<string, typeof voicesQuery.data>) ?? {}
    }, [voicesQuery])
    const { mutateAsync: textToSpeach, isPending: isTextToSpeachPending } = useTextToSpeach()

    const { saveHistoryRecord: save } = useTTSContext()

    const form = useForm<z.infer<typeof TTSRequestSchame>>({
        resolver: zodResolver(TTSRequestSchame),
        defaultValues: {
            options: {
                voice: 'Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)',
            },
            text: '君不见黄河之水天上来，奔流到海不复回。'
        }
    })

    const currentVoice = useVoice(form.getValues('options.voice'))

    const onSubmit = form.handleSubmit(async data => {
        try {
            if (!data) {
                toast({
                    title: 'Error',
                    description: 'Please select voice and locale',
                    variant: 'destructive',
                })
                return
            }
            const response = await axios.get('/api/text-to-speech', {
                responseType: 'blob',
                params: {
                    ...data.options,
                    text: data.text
                }
            })
            const audioData = response.data
          
            const reader = new FileReader()
            const audioUri = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(audioData)
            })
            await save({
                id: uuidv4(),
                createAt: Date.now(),
                text: data.text,
                options: data.options,
                uri: audioUri
            })
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to generate audio',
                variant: 'destructive',
            })
        }
    })

    return <div {...props}>
        <form
            className={clsx('flex flex-col-reverse size-full gap-4',
                'md:flex-row-reverse xl:flex-row'
            )}
            onSubmit={onSubmit}>
            <Form {...form}>
                <div className={clsx('flex flex-col justify-between gap-2',
                )}>
                    <div className={clsx(
                        'grid grid-cols-[repeat(2,minmax(10rem,1fr))] place-content-start gap-2',
                        'md:w-64 md:grid-cols-[repeat(1,minmax(10rem,1fr))]'
                    )}>
                        <FormField name='options.voice' control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="justify-between w-full"
                                            >
                                                <span className={clsx('flex justify-between items-center gap-1 text-sm opacity-50 w-16 truncate')}><Speech />发音人</span>
                                                <span className={clsx('ml-2 flex-1 text-left truncate')}>
                                                    {field.value
                                                        ? getFriendlyVoiceName(field.value, field.value)
                                                        : "Select voice..."}
                                                </span>
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
                                            <Command>
                                                <CommandInput placeholder="Search voice..." />
                                                <CommandList>
                                                    <CommandEmpty>{voicesQuery.isLoading ? <span className={clsx('flex px-2')}>
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        <span className={clsx('ml-2')}>Loading...</span>
                                                    </span> : 'No results found.'}</CommandEmpty>
                                                    {Object.entries(groupedVoices).map(([locale, voices]) => (
                                                        <CommandGroup key={locale} heading={locale}>
                                                            {voices.map((voice) => (
                                                                <PopoverPrimitive.Close asChild
                                                                    key={voice.value}
                                                                >
                                                                    <div>
                                                                        <CommandItem
                                                                            key={voice.value}
                                                                            value={voice.value}
                                                                            onSelect={(value: string) => {
                                                                                field.onChange(value)
                                                                            }}
                                                                        >

                                                                            {getFriendlyVoiceName(voice.value, voice.label)}
                                                                            <Check
                                                                                className={clsx(
                                                                                    "ml-auto",
                                                                                    field.value === voice.value ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />

                                                                        </CommandItem>
                                                                    </div>
                                                                </PopoverPrimitive.Close>
                                                            ))}
                                                        </CommandGroup>))}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        ></FormField>
                        <FormField name='options.personality' control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="justify-between w-full"
                                            >
                                                <span className={clsx('flex justify-between items-center gap-1 text-sm opacity-50 w-16 truncate')}><Smile className="h-4 w-4" />风格</span>
                                                <span className={clsx('ml-2 flex-1 text-left truncate')}>
                                                    {field.value
                                                        ? getFirendlyPersonalityName(field.value)
                                                        : "默认"}
                                                </span>
                                                <ChevronsUpDown className="opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
                                            <Command>
                                                <CommandInput placeholder="Search voice..." />
                                                <CommandList>
                                                    <CommandEmpty>{voicesQuery.isLoading ? <span className={clsx('flex px-2')}>
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        <span className={clsx('ml-2')}>Loading...</span>
                                                    </span> : 'No results found.'}</CommandEmpty>
                                                    <CommandGroup>
                                                        <PopoverPrimitive.Close asChild

                                                        >
                                                            <div>
                                                                <CommandItem
                                                                    value={undefined}
                                                                    onSelect={(value: string) => {
                                                                        field.onChange(undefined)
                                                                    }}
                                                                >
                                                                    默认
                                                                    <Check
                                                                        className={clsx(
                                                                            "ml-auto",
                                                                            field.value === undefined ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />

                                                                </CommandItem>
                                                            </div>
                                                        </PopoverPrimitive.Close>
                                                        {currentVoice?.personalities.map((personality) => (
                                                            <PopoverPrimitive.Close asChild
                                                                key={personality}
                                                            >
                                                                <div>
                                                                    <CommandItem
                                                                        value={personality}
                                                                        onSelect={(value: string) => {
                                                                            field.onChange(value)
                                                                        }}
                                                                    >

                                                                        {getFirendlyPersonalityName(personality)}
                                                                        <Check
                                                                            className={clsx(
                                                                                "ml-auto",
                                                                                field.value === personality ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />

                                                                    </CommandItem>
                                                                </div>
                                                            </PopoverPrimitive.Close>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        ></FormField>
                        <FormField name='options.pitch' control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <span className={clsx('flex gap-2 items-center w-full')}>
                                        <Label>{field.name}</Label>
                                        <Slider
                                            min={-100} max={100} step={1}
                                            value={[field.value ?? 0]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                            className={clsx('h-9 flex-1')} >
                                            <span className={clsx('flex gap-2 items-center text-[0.5rem] text-gray-500')}>{field.value}%</span>
                                        </Slider>
                                        <Button variant={'ghost'} size={'sm'} className={clsx('px-2')}
                                            onClick={() => {
                                                field.onChange(0)
                                            }}
                                        >
                                            <RotateCw />
                                        </Button>
                                    </span>
                                    <FormMessage />
                                </FormItem>
                            )}
                        ></FormField>
                        <FormField name='options.rate' control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <span className={clsx('flex gap-2 items-center w-full')}>
                                        <Label>{field.name}</Label>
                                        <Slider
                                            min={-100} max={100} step={1}
                                            value={[field.value ?? 0]}
                                            onValueChange={(value) => field.onChange(value[0])}
                                            className={clsx('h-9 flex-1')} >
                                            <span className={clsx('flex gap-2 items-center text-[0.5rem] text-gray-500')}>{field.value}%</span>
                                        </Slider>
                                        <Button variant={'ghost'} size={'sm'} className={clsx('px-2')}
                                            onClick={() => {
                                                field.onChange(0)
                                            }}
                                        >
                                            <RotateCw />
                                        </Button>
                                    </span>
                                    <FormMessage />
                                </FormItem>
                            )}
                        ></FormField>
                    </div>
                    <Button
                        className={clsx('-col-end-1 -row-start-1-1')}
                        onClick={onSubmit}>
                        {isTextToSpeachPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Generate'}
                    </Button>
                </div>
                <FormField name="text" control={form.control} render={({ field }) => (
                    <FormItem className={clsx('flex-1',
                        'lg:h-full'
                    )}>
                        <Textarea className={clsx('size-full resize-none')} value={field.value} onChange={e => { field.onChange(e.target.value) }} />
                        <FormMessage></FormMessage>
                    </FormItem>
                )}></FormField>
            </Form>
        </form>
    </div>
}

export default withClientLayout(TTSWorkspace)