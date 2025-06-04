# Complete NestJS WebSocket Chat Application

## 1. Install Dependencies
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install @nestjs/common @nestjs/core @nestjs/platform-express
```

## 2. Message Interface (types/message.interface.ts)
```typescript
export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  room: string;
}

export interface User {
  id: string;
  username: string;
  room: string;
}
```

## 3. Chat Gateway (chat/chat.gateway.ts)
```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessage, User } from '../types/message.interface';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your frontend URL
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Store connected users in memory (use database in production)
  private connectedUsers: Map<string, User> = new Map();
  private messages: ChatMessage[] = []; // Store messages (use database in production)

  // When someone connects
  handleConnection(client: Socket) {
    console.log(`🔗 Client connected: ${client.id}`);
  }

  // When someone disconnects
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

  // User joins a chat room
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { username: string; room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { username, room } = data;

    // Store user info
    const user: User = {
      id: client.id,
      username,
      room,
    };
    this.connectedUsers.set(client.id, user);

    // Join the Socket.IO room
    client.join(room);

    console.log(`✅ ${username} joined room: ${room}`);

    // Send welcome message to the user
    client.emit('message', {
      id: Date.now().toString(),
      username: 'System',
      message: `Welcome to ${room}, ${username}!`,
      timestamp: new Date(),
      room,
    });

    // Tell others in room about new user
    client.to(room).emit('userJoined', {
      username,
      message: `${username} joined the chat`,
    });

    // Send recent messages to new user
    const roomMessages = this.messages
      .filter(msg => msg.room === room)
      .slice(-20); // Last 20 messages
    
    client.emit('previousMessages', roomMessages);

    // Update user list for everyone in room
    this.updateRoomUsers(room);
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

    // Send message to everyone in the room (including sender)
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
        isTyping,
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
```

## 4. Optional: REST API Controller (chat/chat.controller.ts)
```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatGateway: ChatGateway) {}

  // GET /chat/messages/general - Get messages for a room
  @Get('messages/:room')
  getMessages(@Param('room') room: string) {
    return {
      room,
      messages: this.chatGateway.getMessagesForRoom(room),
    };
  }

  // GET /chat/users - Get all connected users
  @Get('users')
  getUsers() {
    return {
      users: this.chatGateway.getConnectedUsers(),
    };
  }
}
```

## 5. Chat Module (chat/chat.module.ts)
```typescript
import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';

@Module({
  providers: [ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}
```

## 6. App Module (app.module.ts)
```typescript
import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [ChatModule],
})
export class AppModule {}
```

## 7. Main File (main.ts)
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for your frontend
  app.enableCors({
    origin: '*', // In production, specify your frontend URL
  });
  
  await app.listen(3000);
  console.log('🚀 Chat server running on http://localhost:3000');
}
bootstrap();
```

## File Structure
```
src/
├── chat/
│   ├── chat.gateway.ts
│   ├── chat.controller.ts
│   └── chat.module.ts
├── types/
│   └── message.interface.ts
├── app.module.ts
└── main.ts
```

## How to Test
1. Run: `npm run start:dev`
2. Use the HTML client I'll provide next
3. Open multiple browser tabs to test multiple users
4. Check console logs to see what's happening
```