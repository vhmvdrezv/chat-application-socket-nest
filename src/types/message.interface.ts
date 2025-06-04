export interface ChatMessage {
    id: string;
    username: string;
    message: string;
    timestamp: Date;
    room: string;
}

export interface User {
    id: string,
    username: string;
    room: string;
}