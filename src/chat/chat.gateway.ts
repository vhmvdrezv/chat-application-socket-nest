import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { timestamp } from "rxjs";
import { Server, Socket } from "socket.io";
import { ChatMessage, User } from "src/types/message.interface";

@WebSocketGateway({
    cors: {
        origin: '*'
    }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private connectedUsers: Map<string, User> = new Map();
    private messages: ChatMessage[] = [];

    // When someone connects
    handleConnection(client: Socket) {
        console.log(`🔗 Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        const user = this.connectedUsers.get(client.id);
        if (user) {
            console.log(`👋 ${user.username} left ${user.room}`);
            
            // Tell others in the room that user left
            client.to(user.room).emit('userLeft', {
                username: user.username,
                message: `${user.username} left the chat`,
            });
            
            // Remove user from memory
            this.connectedUsers.delete(client.id);
            
            // Send updated user list to room
            this.updateRoomUsers(user.room);
        }
    }

    @SubscribeMessage('joinRoom')
    handleJoinRoom(
        @MessageBody() data: { username: string, room: string },
        @ConnectedSocket() client: Socket,
    ) {
        const { username, room } = data;

        // Store user info
        const user: User = {
            id: client.id,
            username,
            room
        };

        this.connectedUsers.set(client.id, user);

        // Join the Socket.IO room
        client.join(room);

        console.log(`✅ ${username} joined room: ${room}`);

        // Send welcome message to the user
        client.emit('message', {
            id: Date.now().toString(),
            username: 'System',
            message: `Welcome to ${room}, ${username}`,
            timestamp: new Date(),
            room
        });

        // Tell others in room about new user
        client.to(room).emit('userJoined', {
            username,
            message: `${username}, joined the chat`,
        });

        // Send recent message to new user
        const roomMessages = this.messages
            .filter(msg => msg.room === room)
            .slice(-20); // Last 20 messages
        
        client.emit('previousMessages', roomMessages);

        this.updateRoomUsers(room)
    }

    // Handle new chat messages
    @SubscribeMessage('sendMessage')
    handleMessage(
        @MessageBody() messageText: string,
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.connectedUsers.get(client.id);
        if (!user) {
            client.emit('error', 'You must join a room first');
            return;
        }

        // Create message object
        const message: ChatMessage = {
            id: Date.now().toString(),
            username: user.username,
            message: messageText,
            timestamp: new Date(),
            room: user.room,
        };

        // Store message (in production, save to database)
        this.messages.push(message);

        // Store message (in production, save to database)
        this.server.to(user.room).emit('message', message);

        console.log(`💬 [${user.room}] ${user.username}: ${messageText}`);
    }

    // User is typing indicator
    @SubscribeMessage('typing')
    handleTyping(
        @MessageBody() isTyping: boolean,
        @ConnectedSocket() client: Socket,
    ) {
        const user = this.connectedUsers.get(client.id);
        if (user) {
            // Tell others in room about typing status
            client.to(user.room).emit('userTyping', {
                username: user.username,
                isTyping
            });
        }
    }

    // Helper method to send updated user list to room
    private updateRoomUsers(room: string) {
        const roomUsers = Array.from(this.connectedUsers.values())
            .filter(user => user.room === room)
            .map(user => ({ id: user.id, username: user.username }));

        this.server.to(room).emit('roomUsers', roomUsers);
    }

    // Get all messages for a room (useful for REST endpoint)
    getMessagesForRoom(room: string): ChatMessage[] {
        return this.messages.filter(msg => msg.room === room);
    }

    // Get all connected users (useful for monitoring)
    getConnectedUsers(): User[] {
        return Array.from(this.connectedUsers.values());
    }
}