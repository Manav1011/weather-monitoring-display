import { useEffect, useRef, useCallback } from 'react';
import { useWeatherStore } from '../store/useWeatherStore';
import type { WebSocketMessage } from '../types/weather';

export const useWeatherSocket = () => {
    const socketRef = useRef<WebSocket | null>(null);
    const isClosingRef = useRef(false);
    const { setCurrentFrame, setAverages, setConnected } = useWeatherStore();

    const connect = useCallback(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN ||
            socketRef.current?.readyState === WebSocket.CONNECTING) {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host.includes('5173') ? 'localhost:8000' : window.location.host;
        const socketUrl = `${protocol}//${host}/ws/serial_communication/consumer/`;

        const socket = new WebSocket(socketUrl);
        socketRef.current = socket;
        isClosingRef.current = false;

        socket.onopen = () => {
            console.log('WebSocket Connected');
            setConnected(true);
            socket.send(JSON.stringify({
                client: 'consumer',
                device: 'rs485',
                action: 'connection'
            }));
        };

        socket.onmessage = (event) => {
            const data: WebSocketMessage = JSON.parse(event.data);

            if (data.action === 'stream' && data.frame) {
                setCurrentFrame(data.frame);
                if (data.averages) {
                    setAverages(data.averages);
                }
            }

            if (data.action === 'graph_received' || data.action === 'no_data' || data.action === 'windrose_received' || data.action === 'no_windrose_data') {
                window.dispatchEvent(new CustomEvent('weather_analytics_received', {
                    detail: data
                }));
            }
        };

        socket.onclose = () => {
            // Only attempt reconnection if it's not a deliberate close from hook cleanup
            if (!isClosingRef.current) {
                console.log('WebSocket Disconnected, attempting reconnection...');
                setConnected(false);
                setTimeout(connect, 3000);
            } else {
                console.log('WebSocket Closed purposely');
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };
    }, [setCurrentFrame, setAverages, setConnected]);

    useEffect(() => {
        connect();
        return () => {
            isClosingRef.current = true;
            socketRef.current?.close();
        };
    }, [connect]);

    const sendAction = (action: string, params: any) => {
        socketRef.current?.send(JSON.stringify({
            client: 'consumer',
            device: 'rs485',
            action,
            ...params
        }));
    };

    return { sendAction };
};
