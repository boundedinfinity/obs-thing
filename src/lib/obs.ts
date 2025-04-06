import {
    OBSWebSocket,
    EventSubscription,
    type OBSResponseTypes,
} from 'obs-websocket-js';
import { type JsonObject } from 'type-fest';

export class ObsThing {
    obs?: OBSWebSocket
    config: ObsConfiguration

    constructor(config: ObsConfiguration) {
        this.config = config
    }

    private async init(): Promise<OBSWebSocket> {
        if (!this.obs) {
            this.obs = new OBSWebSocket();
            const obsConfig: ObsConfiguration = { ...defaultObsConfiguration, ...this.config }
            const url = `ws://${obsConfig.host}:${obsConfig.port}`

            const { obsWebSocketVersion, negotiatedRpcVersion } = await this.obs.connect(
                url, undefined,
                { eventSubscriptions: EventSubscription.All }
            )

            console.log(`Connected to server ${obsWebSocketVersion} (using RPC ${negotiatedRpcVersion})`)
        }

        return this.obs
    }

    async getSources(): Promise<ObsSource[]> {
        await this.init()
        const result = await this.obs!.call('GetInputList')
        //@ts-ignore
        const sources: ObsSource[] = result.inputs.map(obj => {
            return {
                kind: obj['inputKind'],
                name: obj['inputName'],
                uuid: obj['inputUuid'],
            }
        })

        for (const source of sources) {
            const settings = await this.getInputSettings(source.name)
            source.settings = settings
        }

        return sources
    }

    async getInputSettings(name: string): Promise<ObsSettings> {
        await this.init()
        const result = await this.obs!.call('GetInputSettings', { inputName: name })
        const settings: ObsSettings = {
            applicationId: result.inputSettings['application'] as string,
            uuid: result.inputSettings['display_uuid'] as string,
            windowId: result.inputSettings['window'] as number,
        }

        return settings
    }

    async getScenceItem(name: string): Promise<ObsScene[]> {
        await this.init()
        const result = await this.obs!.call('GetSceneItemList', { sceneName: name })
        const scenes: ObsScene[] = result.sceneItems.map(item => {
            const itemTransform = item['sceneItemTransform'] as JsonObject
            const transform: ObsSceneTransform = {
                alignment: itemTransform['alignment'] as number,
                boundsAlignment: itemTransform['boundsAlignment'] as number,
                boundsHeight: itemTransform['boundsHeight'] as number,
                boundsType: itemTransform['boundsType'] as string,
                boundsWidth: itemTransform['boundsWidth'] as number,
                cropBottom: itemTransform['cropBottom'] as number,
                cropLeft: itemTransform['cropLeft'] as number,
                cropRight: itemTransform['cropRight'] as number,
                cropTop: itemTransform['cropTop'] as number,
                cropToBounds: itemTransform['cropToBounds'] as boolean,
                height: itemTransform['height'] as number,
                positionX: itemTransform['positionX'] as number,
                positionY: itemTransform['positionY'] as number,
                rotation: itemTransform['rotation'] as number,
                scaleX: itemTransform['scaleX'] as number,
                scaleY: itemTransform['scaleY'] as number,
                sourceHeight: itemTransform['sourceHeight'] as number,
                sourceWidth: itemTransform['sourceWidth'] as number,
                width: itemTransform['width'] as number,
            }

            const scene: ObsScene = {
                kind: item['inputKind'] as string,
                isGroup: item['isGroup'] as boolean,
                id: item['sceneItemId'] as number,
                index: item['sceneItemIndex'] as number,
                sourceName: item['sourceName'] as string,
                sourceUuid: item['sourceUuid'] as string,
                transform,
            }

            return scene
        })

        return scenes
    }

    async getTransform(id: number) {
        await this.init()
        const result = await this.obs!.call('GetSceneItemTransform', { sceneItemId: id })
        console.log(result)
    }

    async setTransform(id: number, transform: ObsSceneTransform) {
        await this.init()
        await this.obs!.call('SetSceneItemTransform', {
            sceneItemId: id,
            sceneItemTransform: {
                alignment: transform.alignment,
                boundsAlignment: transform.boundsAlignment,
                boundsHeight: transform.boundsHeight,
                boundsType: transform.boundsType,
                boundsWidth: transform.boundsWidth,
                cropBottom: transform.cropBottom,
                cropLeft: transform.cropLeft,
                cropRight: transform.cropRight,
                cropTop: transform.cropTop,
                height: transform.height,
                positionX: transform.positionX,
                positionY: transform.positionY,
                rotation: transform.rotation,
                scaleX: transform.scaleX,
                scaleY: transform.scaleY,
                sourceHeight: transform.sourceHeight,
                sourceWidth: transform.sourceWidth,
                width: transform.width,
            }
        })
    }

    async setInputSettings(name: string, windowId: number) {
        await this.init()
        await this.obs!.call('SetInputSettings', {
            inputName: name,
            inputSettings: {
                window: windowId
            }
        })
    }

    async getProperties(name: string, property: string): Promise<OBSResponseTypes['GetInputPropertiesListPropertyItems']> {
        await this.init()
        const result = await this.obs!.call('GetInputPropertiesListPropertyItems',
            { inputName: name, propertyName: property }
        )

        return result
    }

    async getInputWindows(name: string): Promise<ObsWindowInfo[]> {
        const result = await this.getProperties(name, 'window')
        const re = /\[(.*?)\](.*)/
        const windows = result.propertyItems.map(prop => {
            const itemname = prop['itemName'] as string
            const capture = itemname!.match(re)

            return {
                process: capture![1].trim(),
                name: capture![2].trim(),
                windowId: prop['itemValue'] as number
            } as ObsWindowInfo
        })

        const filtered = windows
            .filter(window => this.config.includedApplications?.includes(window.process))
            .filter(window => !this.config.excludedApplications?.includes(window.process))

        return filtered
    }
}

export const defaultObsConfiguration: ObsConfiguration = {
    host: 'localhost',
    port: 4455,
    includedApplications: ['Google Chrome', 'Code', 'Microsoft Edge', 'Microsoft PowerPoint'],
}

export interface ObsConfiguration {
    host: string
    port: number
    password?: string
    excludedApplications?: string[]
    includedApplications?: string[]
}

export interface ObsWindowInfo {
    process: string
    name: string
    windowId: number
}

export interface ObsSettings {
    applicationId: string
    uuid: string
    windowId: number
}

export interface ObsSource {
    kind: string
    name: string
    uuid: string
    settings: ObsSettings
}

export interface ObsScene {
    kind: string
    isGroup?: boolean
    id: number
    index: number
    transform: ObsSceneTransform
    sourceName: string
    sourceUuid: string
}

export interface ObsSceneTransform {
    alignment: number
    boundsAlignment: number
    boundsHeight: number
    boundsType: string
    boundsWidth: number
    cropBottom: number
    cropLeft: number
    cropRight: number
    cropTop: number
    cropToBounds: boolean
    height: number
    positionX: number
    positionY: number
    rotation: number
    scaleX: number
    scaleY: number
    sourceHeight: number
    sourceWidth: number
    width: number
}
