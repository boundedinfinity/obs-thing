import fs from 'node:fs';
import path from 'node:path';
import type { SyncDescriptor } from '@/lib/descriptor';
import type { ObsConfiguration, ObsSource, ObsWindowInfo } from '@/lib/obs';
import type { MacosWindow } from '@/lib/macos';

interface Configuration {
    obs?: Partial<ObsConfiguration>
    sync: SyncDescriptor[]
    debug?: boolean
}

export interface SyncContext {
    sync: SyncDescriptor
    obsSource?: ObsSource
    obsWindow?: ObsWindowInfo
    macOsWindow?: MacosWindow
}

export function loadConfiguration(): Configuration | undefined {
    const dirs: string[] = []

    if (process.argv.length > 1) {
        let configPath = process.argv[1]
        configPath = path.dirname(configPath)
        dirs.push(path.join(configPath, 'config.json'))
        dirs.push(path.join(configPath, 'bounded-obs.json'))
    }

    if (process.env.HOME || process.env.USERPROFILE) {
        let configPath = process.env.HOME || process.env.USERPROFILE
        dirs.push(path.join(configPath!, 'bounded-obs/config.json'))
        dirs.push(path.join(configPath!, 'bounded-obs/bounded-obs.json'))
    }

    let config: Configuration | undefined

    for (const configPath of dirs) {
        const exists = fs.existsSync(configPath)
        if (!exists) continue
        const configRaw = fs.readFileSync(configPath)
        config = JSON.parse(configRaw.toString())
        break
    }

    return config
}
