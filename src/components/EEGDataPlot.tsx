"use client";
import { useState as useLocalState, useRef as useLocalRef, useCallback as useLocalCallback, useEffect as useLocalEffect } from "react";
import { useMotionValue as useLocalMotionValue } from "framer-motion";

import { Button as UIButton } from "@/components/ui/AppButton";
import { cn as classNames } from "@/lib/helpers";

import {
    Activity as ActivityIcon, Brain as BrainIcon, Heart as HeartIcon, Moon as MoonIcon, Sun as SunIcon, Plug as PlugIcon, PlugZap as PlugZapIcon, Zap as ZapIcon, Clock as ClockIcon, Target as TargetIcon,
    Signal as SignalIcon, TrendingUp as TrendingUpIcon, ActivitySquare as ActivitySquareIcon, Gauge as GaugeIcon, BarChart3 as BarChartIcon, BarChart3, Waves, Brain, Heart, Activity, Clock, Target, Zap, RotateCcw, Wifi, WifiOff, Maximize2, Settings, Download, Share2, Sun, Moon, Signal
} from 'lucide-react';
import { Card as UICard, CardContent as UICardContent, CardDescription as UICardDescription, CardHeader as UICardHeader, CardTitle as UICardTitle } from '@/components/ui/InfoCard';

import { Tabs as UITabs, TabsContent as UITabsContent, TabsList as UITabsList, TabsTrigger as UITabsTrigger } from '@/components/ui/TabNavigation';

import { useBluetoothDataStream as useBluetoothStream } from '../components/BluetoothDataHandler';
import WebglPlotCanvas from '../components/SignalCanvasPlot';

import { WebglPlotCanvasHandle as PlotCanvasHandle } from "../components/SignalCanvasPlot";
import HeartRateVariabilityCanvas, { HeartRateVariabilityHandle as HRVCanvasHandle } from '@/components/HRVWebGLPlot'
import { MoodDisplay, EmotionalState } from "./MentalStateIndicator";
import { predictState as predictMentalState } from "@/lib/mentalStateClassifier";
import { useRouter as useLocalRouter } from 'next/navigation';

export default function BrainSignalVisualizer() {
    const [isDarkMode, setIsDarkMode] = useLocalState(false);
    const eeg1CanvasRef = useLocalRef<PlotCanvasHandle>(null);
    const eeg2CanvasRef = useLocalRef<PlotCanvasHandle>(null);
    const ecgCanvasRef = useLocalRef<PlotCanvasHandle>(null);
    const eeg0BufferRef = useLocalRef<number[]>([]);
    const eeg1BufferRef = useLocalRef<number[]>([]);
    const radarCh0DataRef = useLocalRef<{ subject: string; value: number }[]>([]);
    const radarCh1DataRef = useLocalRef<{ subject: string; value: number }[]>([]);
    const bandWorkerRef = useLocalRef<Worker | null>(null);
    const dataWorkerRef = useLocalRef<Worker | null>(null);
    const [heartbeatActive, setHeartbeatActive] = useLocalState(false);
    const [currentMentalState, setCurrentMentalState] = useLocalState<EmotionalState>("no_data");
    const stateHistoryRef = useLocalRef<{ state: EmotionalState; timestamp: number }[]>([]);
    const lastMentalStateUpdateRef = useLocalRef<number>(0);
    const connectionStartTimeRef = useLocalRef<number | null>(null);
    const [sessionSummary, setSessionSummary] = useLocalState<{
        duration: number;
        averages: {
            alpha: number;
            beta: number;
            theta: number;
            delta: number;
            symmetry: number;
        };
        mentalState: string;
        stateDescription: string;
        focusScore: string;
        symmetry: string;
        data: typeof sessionDataRef.current;
        dominantBands: Record<string, number>;
        mostFrequent: string;
        convert: (ticks: number) => string;
        avgSymmetry: string;
        formattedDuration: string;
        statePercentages: Record<string, string>;
        goodMeditationPct: string;
        weightedEEGScore: number;
    } | null>(null);
    const bpmCurrentRef = useLocalRef<HTMLDivElement>(null);
    const bpmHighRef = useLocalRef<HTMLDivElement>(null);
    const bpmLowRef = useLocalRef<HTMLDivElement>(null);
    const bpmAvgRef = useLocalRef<HTMLDivElement>(null);
    const bpmWorkerRef = useLocalRef<Worker | null>(null);
    const prevSampleCounterRef = useLocalRef<number | null>(null);
    const hrvCurrentRef = useLocalRef<HTMLDivElement>(null);
    const hrvHighRef = useLocalRef<HTMLDivElement>(null);
    const hrvLowRef = useLocalRef<HTMLDivElement>(null);
    const hrvAvgRef = useLocalRef<HTMLDivElement>(null);
    const [hrvHistory, setHrvHistory] = useLocalState<{ time: number; hrv: number }[]>([]);
    const hrvCanvasRef = useLocalRef<HRVCanvasHandle>(null);
    const router = useLocalRouter();
    const leftBetaMV = useLocalMotionValue(0);
    const rightBetaMV = useLocalMotionValue(0);
    const ecgBufferRef = useLocalRef<number[]>([]);
    const [dashboardMode, setDashboardMode] = useLocalState<"radar" | "meditation">("radar");
    const [goalSelected, setGoalSelected] = useLocalState<"anxiety" | "meditation" | "sleep">("anxiety");
    const [resultsVisible, setResultsVisible] = useLocalState(false);
    const goalSelectedRef = useLocalRef(goalSelected);
    const [relaxScore, setRelaxScore] = useLocalState<number | null>(null);
    const sessionDataRef = useLocalRef<{ timestamp: number; alpha: number; beta: number; theta: number; delta: number, symmetry: number }[]>([]);
    const isSessionActiveRef = useLocalRef(false);
    const isMeditatingRef = useLocalRef(false);
    const SAMPLES_PER_SECOND = 500;
    const FFT_WINDOW_SIZE = 256;
    const sampleIndexRef = useLocalRef(0);

    useLocalEffect(() => {
        goalSelectedRef.current = goalSelected;
    }, [goalSelected]);

    useLocalEffect(() => {
        const interval = setInterval(() => {
            setHeartbeatActive(true);
            setTimeout(() => setHeartbeatActive(false), 200);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleDataStream = useLocalCallback((data: number[]) => {
        dataWorkerRef.current?.postMessage({
            command: "process",
            rawData: {
                counter: data[0],
                raw0: data[1],
                raw1: data[2],
                raw2: data[3],
            },
        });
    }, []);

    const { connected: isDeviceConnected, connect: connectDevice, disconnect: disconnectDevice } = useBluetoothStream(handleDataStream);

    const channelPalette: Record<string, string> = {
        ch0: "#C29963",
        ch1: "#548687",
        ch2: "#9A7197",
    };

    const brainBands = [
        { subject: "Delta", value: 0 },
        { subject: "Theta", value: 0 },
        { subject: "Alpha", value: 0 },
        { subject: "Beta", value: 0 },
        { subject: "Gamma", value: 0 },
    ];

    useLocalEffect(() => {
        const worker = new Worker(
            new URL("../webworker/dataProcessor.worker.ts", import.meta.url),
            { type: "module" }
        );
        worker.onmessage = (e) => {
            if (e.data.type === "processedData") {
                const { counter, eeg0, eeg1, ecg } = e.data.data;
                eeg1CanvasRef.current?.updateData([counter, eeg0, 1]);
                eeg2CanvasRef.current?.updateData([counter, eeg1, 2]);
                ecgCanvasRef.current?.updateData([counter, ecg, 3]);
                handleNewSample(eeg0, eeg1);
            }
        };
        dataWorkerRef.current = worker;
        return () => worker.terminate();
    }, []);

    useLocalEffect(() => {
        const w = new Worker(
            new URL("../webworker/bandPower.worker.ts", import.meta.url),
            { type: "module" }
        );

        w.onmessage = (
            e: MessageEvent<{
                smooth0: Record<string, number>;
                smooth1: Record<string, number>;
            }>
        ) => {
            const { smooth0, smooth1 } = e.data;
            leftBetaMV.set(smooth0.beta);
            rightBetaMV.set(smooth1.beta);

            function capitalize(subject: string): string {
                return subject.charAt(0).toUpperCase() + subject.slice(1);
            }

            radarCh0DataRef.current = Object.entries(smooth0).map(
                ([subject, value]) => ({ subject: capitalize(subject), value })
            );

            radarCh1DataRef.current = Object.entries(smooth1).map(
                ([subject, value]) => ({ subject: capitalize(subject), value })
            );

            let score = 0;
            const goal = goalSelectedRef.current;

            if (goal === "anxiety") {
                score = (Number(smooth0.alpha) + Number(smooth1.alpha)) / (Number(smooth0.beta) + Number(smooth1.beta) + 0.001);
            } else if (goal === "meditation") {
                score = (smooth0.theta + smooth1.theta) / 2;
            } else if (goal === "sleep") {
                score = (smooth0.delta + smooth1.delta) / 2;
            }

            const currentData = {
                timestamp: Date.now(),
                alpha: (smooth0.alpha + smooth1.alpha) / 2,
                beta: (smooth0.beta + smooth1.beta) / 2,
                theta: (smooth0.theta + smooth1.theta) / 2,
                delta: (smooth0.delta + smooth1.delta) / 2,
                symmetry: Math.abs(smooth0.alpha - smooth1.alpha),
            };

            if (isSessionActiveRef.current) {
                sessionDataRef.current.push(currentData);
            }

            setRelaxScore(score);
        };

        bandWorkerRef.current = w;
        return () => {
            w.terminate();
        };
    }, []);

    const handleNewSample = useLocalCallback((eeg0: number, eeg1: number) => {
        eeg0BufferRef.current.push(eeg0);
        eeg1BufferRef.current.push(eeg1);
        sampleIndexRef.current++;

        if (eeg0BufferRef.current.length > FFT_WINDOW_SIZE) {
            eeg0BufferRef.current.shift();
            eeg1BufferRef.current.shift();
        }

        if (sampleIndexRef.current % 10 === 0 && eeg0BufferRef.current.length === FFT_WINDOW_SIZE) {
            bandWorkerRef.current?.postMessage({
                eeg0: [...eeg0BufferRef.current],
                eeg1: [...eeg1BufferRef.current],
                sampleRate: SAMPLES_PER_SECOND,
                fftSize: FFT_WINDOW_SIZE,
            });
        }
    }, []);

    const handleNewECG = useLocalCallback((ecg: number) => {
        ecgBufferRef.current.push(ecg);
        if (ecgBufferRef.current.length > 2500) {
            ecgBufferRef.current.shift();
        }
        if (ecgBufferRef.current.length % 500 === 0) {
            bpmWorkerRef.current?.postMessage({
                ecgBuffer: [...ecgBufferRef.current],
                sampleRate: 500,
            });
        }
    }, []);

    useLocalEffect(() => {
        const worker = new Worker(
            new URL("../webworker/bpm.worker.ts", import.meta.url),
            { type: "module" }
        );

        const bpmWindow: number[] = [];
        const windowSize = 5;
        let displayedBPM: number | null = null;
        const maxChange = 2;

        worker.onmessage = (
            e: MessageEvent<{
                bpm: number | null;
                high: number | null;
                low: number | null;
                avg: number | null;
                peaks: number[];
                hrv: number | null;
                hrvHigh: number | null;
                hrvLow: number | null;
                hrvAvg: number | null;
                sdnn: number;
                rmssd: number;
                pnn50: number;
            }>
        ) => {
            const { bpm, high, low, avg, hrv, hrvHigh, hrvLow, hrvAvg, sdnn, rmssd, pnn50 } = e.data;

            if (hrv !== null && !isNaN(hrv)) {
                hrvCanvasRef.current?.addHRVData(hrv);
            }

            if (bpm !== null) {
                bpmWindow.push(bpm);
                if (bpmWindow.length > windowSize) bpmWindow.shift();
                const avgBPM = bpmWindow.reduce((a, b) => a + b, 0) / bpmWindow.length;
                if (displayedBPM === null) displayedBPM = avgBPM;
                else {
                    const diff = avgBPM - displayedBPM;
                    displayedBPM += Math.sign(diff) * Math.min(Math.abs(diff), maxChange);
                }
                if (bpmCurrentRef.current) bpmCurrentRef.current.textContent = `${Math.round(displayedBPM)}`;
            } else {
                bpmWindow.length = 0;
                displayedBPM = null;
                if (bpmCurrentRef.current) bpmCurrentRef.current.textContent = "--";
            }

            if (bpmHighRef.current) bpmHighRef.current.textContent = high !== null ? `${high}` : "--";
            if (bpmLowRef.current) bpmLowRef.current.textContent = low !== null ? `${low}` : "--";
            if (bpmAvgRef.current) bpmAvgRef.current.textContent = avg !== null ? `${avg}` : "--";

            if (hrvCurrentRef.current) hrvCurrentRef.current.textContent = hrv !== null ? `${hrv}` : "--";
            if (hrvHighRef.current) hrvHighRef.current.textContent = hrvHigh !== null ? `${hrvHigh}` : "--";
            if (hrvLowRef.current) hrvLowRef.current.textContent = hrvLow !== null ? `${hrvLow}` : "--";
            if (hrvAvgRef.current) hrvAvgRef.current.textContent = hrvAvg !== null ? `${hrvAvg}` : "--";

            const detectedState = predictMentalState({ sdnn, rmssd, pnn50 });
            const now = Date.now();

            if (connectionStartTimeRef.current === null) {
                connectionStartTimeRef.current = now;
                lastMentalStateUpdateRef.current = now;
            }

            stateHistoryRef.current.push({
                state: detectedState,
                timestamp: now
            });

            const STATE_UPDATE_INTERVAL = 5000;
            const fiveSecondsAgo = now - STATE_UPDATE_INTERVAL;
            stateHistoryRef.current = stateHistoryRef.current.filter(
                item => item.timestamp >= fiveSecondsAgo
            );

            const timeSinceLastUpdate = now - lastMentalStateUpdateRef.current;
            const timeSinceConnection = now - connectionStartTimeRef.current;

            if (timeSinceConnection < STATE_UPDATE_INTERVAL) {
                setCurrentMentalState("no_data");
            } else if (timeSinceLastUpdate >= STATE_UPDATE_INTERVAL) {
                if (stateHistoryRef.current.length > 0) {
                    const stateCounts: Record<string, number> = {};
                    stateHistoryRef.current.forEach(item => {
                        stateCounts[item.state] = (stateCounts[item.state] || 0) + 1;
                    });

                    const dominantState = Object.entries(stateCounts).reduce((a, b) =>
                        a[1] > b[1] ? a : b
                    )[0] as EmotionalState;

                    setCurrentMentalState(dominantState);
                    lastMentalStateUpdateRef.current = now;
                }
            }
        };

        bpmWorkerRef.current = worker;
        return () => {
            worker.terminate();
        };
    }, []);

    useLocalEffect(() => {
        isSessionActiveRef.current = dashboardMode === "meditation";
    }, [dashboardMode]);

    useLocalEffect(() => {
        if (isDeviceConnected) {
            connectionStartTimeRef.current = Date.now();
            lastMentalStateUpdateRef.current = Date.now();
            stateHistoryRef.current = [];
            setCurrentMentalState("no_data");
        } else {
            connectionStartTimeRef.current = null;
            lastMentalStateUpdateRef.current = 0;
            stateHistoryRef.current = [];
            setCurrentMentalState("no_data");
        }
    }, [isDeviceConnected]);

    useLocalEffect(() => {
        const dp = dataWorkerRef.current!;
        const handler = (e: MessageEvent) => {
            if (e.data.type === "processedData") {
                const { eeg0, eeg1, ecg } = e.data.data;
                handleNewSample(eeg0, eeg1);
                handleNewECG(ecg);
            }
        };
        dp.addEventListener("message", handler);
        return () => {
            dp.removeEventListener("message", handler);
        };
    }, [handleNewSample, handleNewECG]);

    return (
        <div className="min-h-screen w-full relative bg-gradient-to-br from-background via-background to-muted/10 transition-all duration-300 overflow-x-hidden">
            {/* Subtle Background Pattern */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-gradient-to-br from-primary/5 to-chart-1/5 blur-3xl animate-gentle-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-gradient-to-br from-chart-2/5 to-chart-3/5 blur-3xl animate-gentle-pulse" style={{animationDelay: '1s'}}></div>
                <div className="absolute top-1/2 left-1/2 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-chart-4/3 to-chart-5/3 blur-3xl animate-gentle-pulse" style={{animationDelay: '2s'}}></div>
            </div>

            {/* Modernized Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/60 shadow-soft">
                <div className="w-full mx-auto px-6 sm:px-8 lg:px-12 py-6">
                    <div className="flex items-center justify-between">
                        {/* Enhanced Logo Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-chart-1 to-chart-2 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500 ease-out"></div>
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-chart-1 shadow-soft-lg">
                                    <Brain className="h-9 w-9 text-primary-foreground" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent">
                                    Neural<span className="text-chart-3">Flow</span>
                                </h1>
                                <p className="text-sm lg:text-base text-muted-foreground font-medium tracking-tight">
                                    Advanced Brain Monitoring System
                                </p>
                            </div>
                        </div>

                        {/* Enhanced Controls */}
                        <div className="flex items-center gap-6">
                            {/* Connection Status Indicator */}
                            <div className={classNames(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border",
                                isDeviceConnected
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                                    : "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/5 dark:border-destructive/20"
                            )}>
                                <div className={classNames(
                                    "h-3 w-3 rounded-full flex-shrink-0 transition-all duration-300",
                                    isDeviceConnected ? "bg-emerald-500 animate-gentle-pulse" : "bg-destructive"
                                )} />
                                <span className="text-sm font-medium hidden sm:inline">
                                    {isDeviceConnected ? "Connected" : "Disconnected"}
                                </span>
                            </div>

                            {/* Action Button */}
                            <UIButton
                                onClick={isDeviceConnected ? disconnectDevice : connectDevice}
                                variant={isDeviceConnected ? "destructive" : "default"}
                                size="lg"
                                className="gap-3 min-w-[140px] font-semibold"
                            >
                                {isDeviceConnected ? (
                                    <>
                                        <PlugZapIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Disconnect</span>
                                    </>
                                ) : (
                                    <>
                                        <PlugIcon className="h-5 w-5" />
                                        <span className="hidden sm:inline">Connect</span>
                                    </>
                                )}
                            </UIButton>

                            {/* Theme Toggle */}
                            <UIButton
                                onClick={() => setIsDarkMode(!isDarkMode)}
                                variant="ghost"
                                size="icon"
                                className="rounded-xl"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </UIButton>
                        </div>
                    </div>
                </div>
            </header>

            {/* Modernized Main Content */}
            <main className="w-full mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-12 space-y-12 bg-gradient-to-br from-background via-background to-muted/20">
                {/* Enhanced Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Device Status */}
                    <UICard className="group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80 hover:from-card to-card/90 border-border/40 hover:border-border/60 hover:scale-[1.02] transition-all duration-300">
                        <UICardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 ring-1 ring-primary/20">
                                    <Signal className="h-6 w-6 text-primary" />
                                </div>
                                <div className={classNames(
                                    "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border",
                                    isDeviceConnected
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                                        : "bg-muted text-muted-foreground border-border"
                                )}>
                                    {isDeviceConnected ? "ONLINE" : "OFFLINE"}
                                </div>
                            </div>
                        </UICardHeader>
                        <UICardContent>
                            <UICardTitle>Device Status</UICardTitle>
                            <UICardDescription>Neural interface connection</UICardDescription>
                        </UICardContent>
                    </UICard>

                    {/* Heart Rate */}
                    <UICard className="group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80 hover:from-card to-card/90 border-border/40 hover:border-border/60 hover:scale-[1.02] transition-all duration-300">
                        <UICardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/50 dark:to-pink-950/50 ring-1 ring-red-200/50 dark:ring-red-800/50">
                                    <Heart className={classNames(
                                        "h-6 w-6 transition-all duration-300",
                                        heartbeatActive ? "text-red-500 scale-110" : "text-red-600 dark:text-red-400"
                                    )} />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-foreground" ref={bpmCurrentRef}>--</div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">BPM</div>
                                </div>
                            </div>
                        </UICardHeader>
                        <UICardContent>
                            <UICardTitle>Heart Rate</UICardTitle>
                            <UICardDescription>Cardiovascular monitoring</UICardDescription>
                        </UICardContent>
                    </UICard>

                    {/* HRV */}
                    <UICard className="group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80 hover:from-card to-card/90 border-border/40 hover:border-border/60 hover:scale-[1.02] transition-all duration-300">
                        <UICardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50 ring-1 ring-purple-200/50 dark:ring-purple-800/50">
                                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-foreground" ref={hrvCurrentRef}>--</div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">MS</div>
                                </div>
                            </div>
                        </UICardHeader>
                        <UICardContent>
                            <UICardTitle>Heart Rate Variability</UICardTitle>
                            <UICardDescription>Autonomic nervous system</UICardDescription>
                        </UICardContent>
                    </UICard>

                    {/* Mental State */}
                    <UICard className="group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80 hover:from-card to-card/90 border-border/40 hover:border-border/60 hover:scale-[1.02] transition-all duration-300">
                        <UICardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50">
                                    <Brain className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                    AI ANALYSIS
                                </div>
                            </div>
                        </UICardHeader>
                        <UICardContent>
                            <UICardTitle>Mental State</UICardTitle>
                            <div className="mt-3">
                                <MoodDisplay state={currentMentalState} />
                            </div>
                        </UICardContent>
                    </UICard>
                </div>

                {/* Enhanced Signal Visualization */}
                <div className="space-y-8">
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Live Signal Monitoring
                        </h2>
                        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl mx-auto">
                            Real-time bioelectric signal visualization
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {/* EEG Channel 1 */}
                        <UICard className="group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80 hover:from-card to-card/90 border-border/40 hover:border-border/60 transition-all duration-300">
                            <UICardHeader>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-chart-5 shadow-sm animate-gentle-pulse"></div>
                                        <UICardTitle className="text-xl">EEG Channel 1</UICardTitle>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1.5 rounded-xl bg-chart-5/10 text-chart-5 border border-chart-5/20 text-xs font-bold uppercase tracking-wider">
                                            FRONTAL CORTEX
                                        </span>
                                        <div className="flex gap-2">
                                            <UIButton variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                <Maximize2 className="h-4 w-4" />
                                            </UIButton>
                                            <UIButton variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                <Settings className="h-4 w-4" />
                                            </UIButton>
                                        </div>
                                    </div>
                                </div>
                            </UICardHeader>
                            <UICardContent>
                                <div className="relative h-48 rounded-xl bg-muted/30 border border-border/60 overflow-hidden">
                                    <WebglPlotCanvas
                                        ref={eeg1CanvasRef}
                                        channels={[1]}
                                        colors={{ 1: "#F59E0B" }}
                                        gridnumber={10}
                                    />
                                </div>
                            </UICardContent>
                        </UICard>

                        {/* EEG Channel 2 */}
                        <UICard className="group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80 hover:from-card to-card/90 border-border/40 hover:border-border/60 transition-all duration-300">
                            <UICardHeader>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-chart-2 shadow-sm animate-gentle-pulse"></div>
                                        <UICardTitle className="text-xl">EEG Channel 2</UICardTitle>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1.5 rounded-xl bg-chart-2/10 text-chart-2 border border-chart-2/20 text-xs font-bold uppercase tracking-wider">
                                            PARIETAL CORTEX
                                        </span>
                                        <div className="flex gap-2">
                                            <UIButton variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                <Maximize2 className="h-4 w-4" />
                                            </UIButton>
                                            <UIButton variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                <Settings className="h-4 w-4" />
                                            </UIButton>
                                        </div>
                                    </div>
                                </div>
                            </UICardHeader>
                            <UICardContent>
                                <div className="relative h-48 rounded-xl bg-muted/30 border border-border/60 overflow-hidden">
                                    <WebglPlotCanvas
                                        ref={eeg2CanvasRef}
                                        channels={[2]}
                                        colors={{ 2: "#06B6D4" }}
                                        gridnumber={10}
                                    />
                                </div>
                            </UICardContent>
                        </UICard>

                        {/* ECG Signal */}
                        <UICard className="group relative overflow-hidden bg-gradient-to-br from-card/95 to-card/80 hover:from-card to-card/90 border-border/40 hover:border-border/60 transition-all duration-300">
                            <UICardHeader>
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <div className="w-3 h-3 rounded-full bg-chart-4 shadow-sm animate-gentle-pulse"></div>
                                        <UICardTitle className="text-xl">ECG Signal</UICardTitle>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="px-3 py-1.5 rounded-xl bg-chart-4/10 text-chart-4 border border-chart-4/20 text-xs font-bold uppercase tracking-wider">
                                            CARDIAC RHYTHM
                                        </span>
                                        <div className="flex gap-2">
                                            <UIButton variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                <Maximize2 className="h-4 w-4" />
                                            </UIButton>
                                            <UIButton variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                                <Settings className="h-4 w-4" />
                                            </UIButton>
                                        </div>
                                    </div>
                                </div>
                            </UICardHeader>
                            <UICardContent>
                                <div className="relative h-48 rounded-xl bg-muted/30 border border-border/60 overflow-hidden">
                                    <WebglPlotCanvas
                                        ref={ecgCanvasRef}
                                        channels={[3]}
                                        colors={{ 3: "#F43F5E" }}
                                        gridnumber={10}
                                    />
                                </div>
                            </UICardContent>
                        </UICard>
                    </div>
                </div>

                {/* Enhanced Brain Wave Analysis & Training */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Brain Wave Analysis */}
                    <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-8 hover:shadow-2xl transition-all duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-200 dark:from-violet-900/50 dark:to-purple-800/50">
                                    <Waves className="h-7 w-7 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Brain Wave Analysis</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Real-time frequency distribution</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Hemisphere */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg"></div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Left Hemisphere</h4>
                                </div>
                                <div className="space-y-4">
                                    {["Delta", "Theta", "Alpha", "Beta", "Gamma"].map((band, index) => {
                                        const value = radarCh0DataRef.current.find((d) => d.subject === band)?.value ?? 0;
                                        const colors = [
                                            "from-indigo-500 to-purple-600",
                                            "from-blue-500 to-indigo-600",
                                            "from-green-500 to-blue-600",
                                            "from-yellow-500 to-orange-600",
                                            "from-red-500 to-pink-600"
                                        ];
                                        const frequencies = ["0.5-4 Hz", "4-8 Hz", "8-13 Hz", "13-30 Hz", "30-100 Hz"];
                                        return (
                                            <div key={band} className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-slate-100">{band}</span>
                                                        <span className="text-xs text-slate-500 ml-2">{frequencies[index]}</span>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">{value.toFixed(1)}%</span>
                                                </div>
                                                <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${colors[index]} transition-all duration-1000 ease-out shadow-lg`}
                                                        style={{ width: `${Math.min(value, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Hemisphere */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-4 h-4 rounded-full bg-green-500 shadow-lg"></div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Right Hemisphere</h4>
                                </div>
                                <div className="space-y-4">
                                    {["Delta", "Theta", "Alpha", "Beta", "Gamma"].map((band, index) => {
                                        const value = radarCh1DataRef.current.find((d) => d.subject === band)?.value ?? 0;
                                        const colors = [
                                            "from-indigo-500 to-purple-600",
                                            "from-blue-500 to-indigo-600",
                                            "from-green-500 to-blue-600",
                                            "from-yellow-500 to-orange-600",
                                            "from-red-500 to-pink-600"
                                        ];
                                        const frequencies = ["0.5-4 Hz", "4-8 Hz", "8-13 Hz", "13-30 Hz", "30-100 Hz"];
                                        return (
                                            <div key={band} className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className="font-bold text-slate-900 dark:text-slate-100">{band}</span>
                                                        <span className="text-xs text-slate-500 ml-2">{frequencies[index]}</span>
                                                    </div>
                                                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">{value.toFixed(1)}%</span>
                                                </div>
                                                <div className="relative h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full bg-gradient-to-r ${colors[index]} transition-all duration-1000 ease-out shadow-lg`}
                                                        style={{ width: `${Math.min(value, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Action Buttons */}
                {/* Modernized Action Buttons */}
                <div className="flex flex-wrap justify-center gap-6 pt-8">
                    <UIButton variant="outline" size="lg" className="gap-3 font-semibold">
                        <Download className="h-5 w-5" />
                        Export Data
                    </UIButton>
                    <UIButton variant="outline" size="lg" className="gap-3 font-semibold">
                        <Share2 className="h-5 w-5" />
                        Share Session
                    </UIButton>
                    <UIButton variant="outline" size="lg" className="gap-3 font-semibold">
                        <RotateCcw className="h-5 w-5" />
                        Reset Session
                    </UIButton>
                </div>
            </main>
        </div>
    );
}

