import { create } from 'zustand';
import type { WeatherFrame, WeatherAverages } from '../types/weather';

interface WeatherState {
    currentFrame: WeatherFrame | null;
    averages: WeatherAverages | null;
    isConnected: boolean;
    history: WeatherFrame[];
    minMax: Record<string, { min: number; max: number }>;

    setCurrentFrame: (frame: WeatherFrame) => void;
    setAverages: (averages: WeatherAverages) => void;
    setConnected: (status: boolean) => void;
    initMinMax: (initialValues: Record<string, { min: number; max: number }>) => void;
    resetMinMax: () => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
    currentFrame: null,
    averages: null,
    isConnected: false,
    history: [],
    minMax: {},

    setCurrentFrame: (frame) => set((state) => {
        const newMinMax = { ...state.minMax };

        // List of keys to track min/max for
        const keys = ['ATMP', 'HUMD', 'WSPD', 'WDIR', 'RAIN', 'BPRS', 'SRAD'];

        keys.forEach(key => {
            const val = frame[key];
            if (typeof val === 'number') {
                if (!newMinMax[key]) {
                    newMinMax[key] = { min: val, max: val };
                } else {
                    newMinMax[key] = {
                        min: Math.min(newMinMax[key].min, val),
                        max: Math.max(newMinMax[key].max, val)
                    };
                }
            }
        });

        const isDuplicate = state.history.length > 0 && state.history[state.history.length - 1].RTC === frame.RTC;

        return {
            currentFrame: frame,
            minMax: newMinMax,
            history: isDuplicate ? state.history : [...state.history.slice(-99), frame]
        };
    }),
    setAverages: (averages) => set({ averages }),
    setConnected: (isConnected) => set({ isConnected }),
    initMinMax: (initialValues) => set({ minMax: initialValues }),
    resetMinMax: () => set({ minMax: {} }),
}));
