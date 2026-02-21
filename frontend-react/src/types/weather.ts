export interface WeatherFrame {
    RTC: string;
    ATMP: number;
    HUMD: number;
    WSPD: number;
    WDIR: number;
    RAIN: number;
    SRAD: number;
    BPRS: number;
    [key: string]: any;
}

export interface WeatherAverages {
    date: string;
    WSPD: number;
    WDIR: number;
    ATMP: number;
    HUMD: number;
    RAIN: number;
    SRAD: number;
    BPRS: number;
    [key: string]: any;
}

export interface WebSocketMessage {
    action: 'stream' | 'store' | 'connection' | 'graph_received' | 'no_data' | 'windrose_received' | 'no_windrose_data';
    device: string;
    frame?: WeatherFrame;
    averages?: WeatherAverages;
    image_base64?: string;
    df_html?: string;
    df_csv?: string;
}
