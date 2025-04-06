"use server";
import { MacOsThing, type MacosWindow } from "@/lib/macos";
import {
    ObsThing,
    defaultObsConfiguration,
    type ObsSource,
    type ObsWindowInfo,
} from "@/lib/obs";

const macOsThing = new MacOsThing();
const obsThing = new ObsThing(defaultObsConfiguration);

export async function getAllWindows(): Promise<MacosWindow[]> {
    return await macOsThing.getEveryWindow();
}

export async function getWindow(name: string): Promise<MacosWindow> {
    return await macOsThing.getWindowInfoByName(name);
}

export async function getWindows(names: string[]): Promise<MacosWindow[]> {
    return await macOsThing.getWindowInfos(names);
}

export async function getSources(): Promise<WindowInfo[]> {
    const infos: WindowInfo[] = [];
    const sources = await obsThing.getSources();
    const screenSources = sources.filter(
        (source) => source.kind === "screen_capture"
    );

    const osWindows = await macOsThing.getEveryWindow();
    for (const osWindow of osWindows) {
        try {
            const xx = await macOsThing.getWindowInfo(
                osWindow.process,
                osWindow.window
            );
            console.log(xx);
        } catch (e) {
            console.log(e);
        }
    }

    for (const source of screenSources) {
        const windows = await obsThing.getInputWindows(source.name);
        // Promise.all()

        for (const window of windows) {
            const info: WindowInfo = { obs: window };

            try {
                info.os = await macOsThing.getWindowInfo(
                    window.process,
                    window.name
                );
            } catch (e) {
                console.log(e);
            }

            infos.push(info);
        }
    }

    return infos;
}

export interface WindowInfo {
    obs: ObsWindowInfo;
    os?: MacosWindow;
}
