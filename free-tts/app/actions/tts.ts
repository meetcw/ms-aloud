'use server'

import { EdgeTTSService } from '@/service/edge-tts-service'
import { TTSOptions, Voice } from '@/service/tts-service'
import Keyv from 'keyv'

const voicesCache = new Keyv<Voice[]>()

async function getVoices() {
    let voices = await voicesCache.get('voices')
    if (!voices) {
        const service = new EdgeTTSService()
        voices = await service.fetchVoices()
        await voicesCache.set('voices', voices)
    }
    return voices
}

export async function listLocales() {
    const voices = await getVoices()
    return voices?.map(voice => voice.locale).filter((value, index, self) => self.indexOf(value) === index) ?? []
}

export async function listVoices(locale?: string) {
    const voices = await getVoices()
    if (locale) {
        return voices?.filter(voice => voice.locale === locale) ?? []
    }
    return voices ?? []
}

export async function textToSpeach(text: string, options: TTSOptions) {
    const service = new EdgeTTSService()
    const data = await service.convert(text, options)
    const base64Audio = Buffer.from(data.audio).toString('base64')
    return base64Audio
}