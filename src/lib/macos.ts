import util from "node:util";
import { exec } from 'node:child_process';
import path from 'node:path';
import type { SyncDescriptor } from '@/lib/descriptor';

export class MacOsThing {
    config: MacosConfiguration

    constructor(config?: Partial<MacosConfiguration>) {
        this.config = { ...defaultMacosConfiguration, ...config }
    }

    private async osascript(script: string): Promise<string> {
        if (this.config.debug)
            console.log(dedent(script))

        const args = script
            .trim()
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(arg => `-e '${arg}'`)
        const command = `osascript ${args.join(' ')}`
        const result = await util.promisify(exec)(command)
        //TODO: Figure out why returning as stderr
        const output = result.stderr;
        return output
    }

    async setOsWindow(info: MacosWindow, sd: SyncDescriptor) {
        const script = `
            tell application "System Events" to tell process "${info.process}"
                tell window "${info.window}"
                    set size to {${sd.width}, ${sd.height}}
                end tell
            end tell
        `
        const result = await this.osascript(script)
        console.log(result)
    }

    async getWindowInfos(names: string[]): Promise<MacosWindow[]> {
        const promises = names.map(name => this.getWindowInfoByName(name))
        const windows: MacosWindow[] = []

        for (const promise of promises)
            windows.push(await promise)

        return windows
    }

    async getWindowInfoByName(name: string): Promise<MacosWindow> {
        const comps = name.trim().replaceAll('[', '').split(']')

        if (comps.length !== 2)
            throw new Error(`invalid window name: ${name}`)

        const application = comps[0].trim()
        const window = comps[1].trim()

        return this.getWindowInfo(application, window)
    }

    async getWindowInfo(application: string, window: string): Promise<MacosWindow> {
        const script = `
            tell application "System Events"
                tell process "${application}"
                    log (get bundle identifier)
                    tell window "${window}"
                        log (get size)
                        log (get position)
                    end tell
                end tell
            end tell
        `

        const result = await this.osascript(script)

        const lines = result
            .split('\n')
            .filter(line => line.length > 0)
            .map(line => line.trim())
            .map(line => line.replaceAll('(*', ''))
            .map(line => line.replaceAll('*)', ''))

        if (lines.length < 3)
            throw new Error(`unexpected result for [${application}] ${window}: ${result}`)

        const size = lines[1].split(',').map(x => x.trim()).map(x => parseInt(x))
        const position = lines[2].split(',').map(x => x.trim()).map(x => parseInt(x))

        const record: MacosWindow = {
            process: application,
            window: window,
            bundleIdentifier: lines[0],
            height: size[0],
            width: size[1],
            x: position[0],
            y: position[1]
        }

        return record
    }

    async getEveryWindow(): Promise<MacosWindow[]> {
        const script = `
            tell application "System Events"
                repeat with _PROCESS in (application processes where background only is false)
                    repeat with _WINDOW in every window of _PROCESS
                        try
                            log "-----------------------------"
                            log displayed name of _PROCESS as string
                            log bundle identifier of _PROCESS as string
                            log name of the _WINDOW as string
                            log (get size of _WINDOW)
                            log (get position of _WINDOW)
                        on error _ERRMSG
                            log _ERRMSG
                        end try
                    end repeat
                end repeat
            end tell
        `
        const result = await this.osascript(script)
        const appInfos: MacosWindow[] = result
            .split('-----------------------------')
            .filter(line => line.length > 0)
            .filter(line => !line.includes('execution error'))
            .map((process: string) => {
                let result: MacosWindow | undefined

                try {
                    const lines = process.split('\n').filter(line => line.length > 0)

                    if (lines.length < 5) return undefined
                    const size = lines[3].split(',').map(x => x.trim()).map(x => parseInt(x))
                    const position = lines[4].split(',').map(x => x.trim()).map(x => parseInt(x))
                    return {
                        process: lines[0],
                        bundleIdentifier: lines[1],
                        window: lines[2],
                        height: size[0],
                        width: size[1],
                        x: position[0],
                        y: position[1]
                    } as MacosWindow
                } catch (e) {
                    console.error(e)
                }

                return result
            }).filter(info => info !== undefined)

        return appInfos
    }

    powerPointTitle(filepath: string): string {
        let title = filepath

        title = title.trim()
        title = path.basename(title)
        const ext = path.extname(title)
        title = title.replace(ext, '')

        return title
    }

    async openProgram(filepath: string): Promise<void> {
        const ext = path.extname(filepath)
        let command: string
        switch (ext) {
            case '.ppt':
            case '.pptx':
                command = `open ${filepath}`
                break
            default:
                throw new Error(`extention not supported: ${ext}: cannot open ${filepath}`)
        }

        // open -b com.mitchellh.ghostty --args --working-directory="~/Documents/python-test"

        const result = await util.promisify(exec)(command)
        console.log(result)
    }
}


export interface MacosConfiguration {
    debug: boolean
}

const defaultMacosConfiguration: MacosConfiguration = {
    debug: false
}

export interface MacosWindow {
    process: string
    window: string
    bundleIdentifier: string
    height: number
    width: number
    x: number
    y: number
}

function dedent(text: string): string {
    const shortest = text
        .split('\n')
        .filter(line => line.trim().length > 0)
        .reduce(
            (acc, line) => {
                const lineL = line.length
                const trimL = line.trimStart().length
                const len = lineL - trimL
                return len < acc ? len : acc
            },
            Number.MAX_SAFE_INTEGER
        )

    const dedented = text
        .split('\n')
        .map(line => line.replace(" ".repeat(shortest), ''))
        .join('\n')

    return dedented
}
