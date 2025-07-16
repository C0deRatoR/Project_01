"use client";
import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Utility function for class names
const cn = (...classes: (string | undefined | null | boolean)[]) => {
    return classes.filter(Boolean).join(' ');
};

// Import icons
import {
    Activity, Brain, Heart, Moon, Sun, Plug, PlugZap, 
    Signal, TrendingUp, Waves, Maximize2, Settings, 
    Download, Share2, Monitor, Sparkles, RotateCcw,
    Zap, Cpu, Radio, Play, Pause, MoreHorizontal
} from 'lucide-react';

// Modern Button component with clean styling
interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    disabled?: boolean;
}

const Button: React.FC<ButtonProps> = React.memo(({ 
    children, 
    onClick, 
    variant = "primary", 
    size = "md", 
    className = "", 
    disabled = false,
    ...props 
}) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    
    const variants = {
        primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700",
        ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800",
        outline: "border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    };
    
    const sizes = {
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-10 px-4 text-sm rounded-lg",
        lg: "h-12 px-6 text-base rounded-lg"
    };
    
    return (
        <button
            className={cn(baseStyles, variants[variant], sizes[size], className)}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
});
Button.displayName = "Button";

// Clean MoodDisplay component
const MoodDisplay = React.memo(({ state }: { state: string }) => {
    const stateStyles = {
        "no_data": "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        "relaxed": "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        "focused": "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        "stressed": "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        "calm": "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
    };
    
    const displayText = state.replace('_', ' ').toUpperCase();
    
    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
            stateStyles[state as keyof typeof stateStyles] || stateStyles.no_data
        )}>
            <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                state === "relaxed" ? "bg-emerald-500" :
                state === "focused" ? "bg-blue-500" :
                state === "stressed" ? "bg-red-500" :
                state === "calm" ? "bg-teal-500" :
                "bg-slate-400"
            )} />
            {displayText}
        </div>
    );
});
MoodDisplay.displayName = "MoodDisplay";

// Minimalist signal visualization component
const SignalVisualization = React.memo(({ color = "emerald", isActive = false }: { color?: string, isActive?: boolean }) => {
    return (
        <div className="w-full h-full bg-slate-50/80 dark:bg-slate-900/80 rounded-lg relative overflow-hidden">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                    <defs>
                        <pattern id={`grid-${color}`} width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#grid-${color})`} />
                </svg>
            </div>
            
            {/* Signal visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                    className="relative"
                    animate={isActive ? { 
                        opacity: [0.6, 1, 0.6],
                        scale: [1, 1.05, 1]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Waves className={cn("h-6 w-6", `text-${color}-500`)} />
                </motion.div>
            </div>
            
            {/* Status indicator */}
            <div className="absolute top-2 right-2">
                <div className={cn(
                    "w-2 h-2 rounded-full",
                    isActive ? `bg-${color}-500 animate-pulse` : "bg-slate-300"
                )} />
            </div>
        </div>
    );
});
SignalVisualization.displayName = "SignalVisualization";

// Main component with completely new layout
export default function BrainSignalVisualizer() {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [currentBPM, setCurrentBPM] = useState("--");
    const [currentHRV, setCurrentHRV] = useState("--");
    const [currentMentalState, setCurrentMentalState] = useState("no_data");

    // Brain wave data
    const brainWaveData = useMemo(() => ({
        left: [
            { label: "Delta", value: 15, frequency: "0.5-4 Hz" },
            { label: "Theta", value: 25, frequency: "4-8 Hz" },
            { label: "Alpha", value: 35, frequency: "8-13 Hz" },
            { label: "Beta", value: 20, frequency: "13-30 Hz" },
            { label: "Gamma", value: 5, frequency: "30-100 Hz" }
        ],
        right: [
            { label: "Delta", value: 18, frequency: "0.5-4 Hz" },
            { label: "Theta", value: 22, frequency: "4-8 Hz" },
            { label: "Alpha", value: 32, frequency: "8-13 Hz" },
            { label: "Beta", value: 23, frequency: "13-30 Hz" },
            { label: "Gamma", value: 5, frequency: "30-100 Hz" }
        ]
    }), []);

    // Event handlers
    const connectDevice = useCallback(() => {
        setIsDeviceConnected(true);
    }, []);

    const disconnectDevice = useCallback(() => {
        setIsDeviceConnected(false);
    }, []);

    const toggleTheme = useCallback(() => {
        setIsDarkMode(prev => !prev);
    }, []);

    // Simulate real-time data updates
    useEffect(() => {
        if (isDeviceConnected) {
            const interval = setInterval(() => {
                setCurrentBPM(`${Math.floor(Math.random() * 20) + 65}`);
                setCurrentHRV(`${Math.floor(Math.random() * 15) + 35}`);
                
                const states = ["relaxed", "focused", "calm"];
                setCurrentMentalState(states[Math.floor(Math.random() * states.length)]);
            }, 3000);
            return () => clearInterval(interval);
        } else {
            setCurrentBPM("--");
            setCurrentHRV("--");
            setCurrentMentalState("no_data");
        }
    }, [isDeviceConnected]);

    return (
        <div className={cn("min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300", isDarkMode && "dark")}>
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <motion.header 
                    className="flex items-center justify-between mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg blur opacity-75"></div>
                            <div className="relative h-12 w-12 flex items-center justify-center rounded-lg bg-emerald-600 shadow-lg">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                Neural<span className="text-emerald-600">Flow</span>
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-400">Advanced Brain Monitoring System</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            onClick={isDeviceConnected ? disconnectDevice : connectDevice}
                            variant={isDeviceConnected ? "outline" : "primary"}
                            className="gap-2"
                        >
                            {isDeviceConnected ? <PlugZap className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
                            {isDeviceConnected ? "Disconnect" : "Connect Device"}
                        </Button>
                        <Button onClick={toggleTheme} variant="ghost" size="md" className="h-10 w-10 p-0">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isDarkMode ? "sun" : "moon"}
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                                </motion.div>
                            </AnimatePresence>
                        </Button>
                    </div>
                </motion.header>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
                    {/* Left Column - Stats */}
                    <div className="col-span-3 space-y-6">
                        {/* Connection Status */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    isDeviceConnected ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-slate-100 dark:bg-slate-800"
                                )}>
                                    <Signal className={cn(
                                        "h-5 w-5",
                                        isDeviceConnected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                                    )} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Device Status</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Neural Interface</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={cn(
                                    "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold",
                                    isDeviceConnected 
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" 
                                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                )}>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        isDeviceConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                                    )} />
                                    {isDeviceConnected ? "ONLINE" : "OFFLINE"}
                                </div>
                            </div>
                        </motion.div>

                        {/* Vital Signs */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Vital Signs</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4 text-red-500" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Heart Rate</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentBPM}</div>
                                        <div className="text-xs text-slate-500">BPM</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-blue-500" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">HRV</span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{currentHRV}</div>
                                        <div className="text-xs text-slate-500">MS</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Mental State */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <Brain className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Mental State</h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">AI Analysis</p>
                                </div>
                            </div>
                            <div className="text-center">
                                <MoodDisplay state={currentMentalState} />
                            </div>
                        </motion.div>

                        {/* Session Controls */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Session Control</h3>
                            <div className="space-y-3">
                                <Button variant="outline" className="w-full gap-2 justify-start">
                                    <Download className="h-4 w-4" />
                                    Export Data
                                </Button>
                                <Button variant="outline" className="w-full gap-2 justify-start">
                                    <Share2 className="h-4 w-4" />
                                    Share Results
                                </Button>
                                <Button variant="outline" className="w-full gap-2 justify-start">
                                    <RotateCcw className="h-4 w-4" />
                                    Reset Session
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    {/* Center Column - Main Visualization */}
                    <div className="col-span-6 space-y-6">
                        {/* Signal Monitors */}
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { title: "EEG Channel 1", subtitle: "Frontal", color: "emerald" },
                                { title: "EEG Channel 2", subtitle: "Parietal", color: "blue" },
                                { title: "ECG Signal", subtitle: "Cardiac", color: "red" }
                            ].map((signal, index) => (
                                <motion.div
                                    key={signal.title}
                                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{signal.title}</h4>
                                            <p className="text-xs text-slate-500">{signal.subtitle}</p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="h-24">
                                        <SignalVisualization color={signal.color} isActive={isDeviceConnected} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Brain Wave Analysis */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                        <Waves className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Brain Wave Analysis</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Real-time frequency distribution</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    PROCESSING
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Left Hemisphere */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Left Hemisphere</h4>
                                    </div>
                                    {brainWaveData.left.map((wave, index) => (
                                        <motion.div
                                            key={wave.label}
                                            className="space-y-2"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{wave.label}</span>
                                                    <span className="text-xs text-slate-500 ml-2">{wave.frequency}</span>
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                                    {isDeviceConnected ? wave.value.toFixed(1) : "--"}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: isDeviceConnected ? `${wave.value}%` : "0%" }}
                                                    transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Right Hemisphere */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">Right Hemisphere</h4>
                                    </div>
                                    {brainWaveData.right.map((wave, index) => (
                                        <motion.div
                                            key={wave.label}
                                            className="space-y-2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{wave.label}</span>
                                                    <span className="text-xs text-slate-500 ml-2">{wave.frequency}</span>
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                                    {isDeviceConnected ? wave.value.toFixed(1) : "--"}%
                                                </span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: isDeviceConnected ? `${wave.value}%` : "0%" }}
                                                    transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column - Metrics & Info */}
                    <div className="col-span-3 space-y-6">
                        {/* Session Statistics */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Session Statistics</h3>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: "Duration", value: isDeviceConnected ? "12:45" : "--:--" },
                                    { label: "Average Alpha", value: isDeviceConnected ? "33.5%" : "--%%" },
                                    { label: "Average Beta", value: isDeviceConnected ? "21.5%" : "--%%" },
                                    { label: "Focus Index", value: isDeviceConnected ? "78%" : "--%%" }
                                ].map((stat, index) => (
                                    <motion.div
                                        key={stat.label}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                                    >
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{stat.label}</span>
                                        <span className="font-bold text-slate-900 dark:text-slate-100">{stat.value}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* System Information */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                                    <Monitor className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">System Information</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Signal Quality</span>
                                    <span className={cn(
                                        "font-medium",
                                        isDeviceConnected ? "text-emerald-600" : "text-slate-500"
                                    )}>
                                        {isDeviceConnected ? "Excellent" : "No Signal"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Noise Level</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {isDeviceConnected ? "Minimal" : "N/A"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Sample Rate</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {isDeviceConnected ? "500 Hz" : "0 Hz"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">Channels Active</span>
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {isDeviceConnected ? "3/3" : "0/3"}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div 
                            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/60"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <Activity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">Recent Activity</h3>
                            </div>
                            <div className="space-y-3">
                                {isDeviceConnected ? (
                                    <>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span>Device connected successfully</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                                            <span>Data stream initiated</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span>Signal quality: Excellent</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="text-slate-400 dark:text-slate-500 text-sm">
                                            No recent activity
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
