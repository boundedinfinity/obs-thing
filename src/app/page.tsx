"use client";
import Image from "next/image";
import { OrbitProgress } from "react-loading-indicators";
import { useState, useRef, type SetStateAction, Dispatch } from "react";
import { type MacosWindow } from "@/lib/macos";
import { type ObsSource } from "@/lib/obs";
import { getAllWindows, getWindow, getSources, type WindowInfo } from "@/lib/server";

function GetMacOsWindowButton(props: {
  setWindows: Dispatch<SetStateAction<MacosWindow[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const { setWindows: setWindows, setLoading } = props;
  async function handleClick() {
    setLoading(true);
    const results = await getAllWindows();
    setLoading(false);
    setWindows(results);
  }

  return (
    <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleClick}>
      Load Mac OS Windows
    </button>
  );
}

function GetObsSources() {
  const [obsSources, setObsSources] = useState<WindowInfo[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const results = await getSources();
    setObsSources(results);
    console.log(results);
    setLoading(false);
  }

  return (
    <div>
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleClick}>
        Get Sources
      </button>
    </div>
  );
}

function GetMacosWindowInfo() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [macOsWindows, setMacOsWindows] = useState<MacosWindow[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (inputRef.current && inputRef.current.value !== "") {
      console.log(inputRef.current.value);
      setLoading(true);
      const results = await getWindow(inputRef.current.value);
      setMacOsWindows([results]);
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        type="text"
        ref={inputRef}
        className="border-2 border-blue-500 text-blue-900 m-6 p-4"
        placeholder="Enter the name of the window"
      />
      <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleClick}>
        Get Info
      </button>
      <MacOsWindowsView windows={macOsWindows} loading={loading} />
    </div>
  );
}

function MacOsWindowsView(props: { windows: MacosWindow[]; loading: boolean }) {
  const { windows, loading } = props;
  return (
    <div>
      {loading && <OrbitProgress color="--color-blue-500" size="medium" text="" textColor="" />}

      {windows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th className="px-4">Process</th>
              <th className="px-4">Application ID</th>
              <th className="px-4">Window Title</th>
              <th className="px-4">Width</th>
              <th className="px-4">Height</th>
              <th className="px-4">X</th>
              <th className="px-4">Y</th>
            </tr>
          </thead>
          <tbody>
            {windows.map((window, index) => (
              <MacOsWindowView key={index} window={window} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function MacOsWindowView(props: { window: MacosWindow }) {
  const { window } = props;
  return (
    <tr className="border-b border-black dark:border-white">
      <td className="px-4">{window.process}</td>
      <td className="px-4">{window.bundleIdentifier}</td>
      <td className="px-4">{window.window}</td>
      <td className="px-4">{window.width}</td>
      <td className="px-4">{window.height}</td>
      <td className="px-4">{window.x}</td>
      <td className="px-4">{window.y}</td>
    </tr>
  );
}

export default function Home() {
  const [macOsWindows, setMacOsWindows] = useState<MacosWindow[]>([]);
  const [macOsWindowsLoading, setMacOsWindowsLoading] = useState(false);

  return (
    <div className="items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <ul className="list-inside  text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li>
            <GetObsSources />
          </li>
          <li>
            <GetMacosWindowInfo />
          </li>
          <li>
            <GetMacOsWindowButton setWindows={setMacOsWindows} setLoading={setMacOsWindowsLoading} />
          </li>
          <li>
            <MacOsWindowsView windows={macOsWindows} loading={macOsWindowsLoading} />
          </li>
        </ul>
      </main>
    </div>
  );
}
