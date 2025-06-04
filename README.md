NestJS WebSocket Chat Application
A real-time chat application built with NestJS and Socket.IO. This project demonstrates a simple yet robust chat backend with WebSocket support, user presence, typing indicators, and a REST API for monitoring. A ready-to-use HTML frontend is included for quick testing.

Features

Real-time messaging using WebSockets (Socket.IO)
Multiple chat rooms support
User presence: See who is online in each room
Typing indicators
Message history (last 20 messages per room)
REST API to fetch users and messages
Frontend: Simple, modern HTML/JS client included
CORS enabled for easy frontend integration


Table of Contents

Installation
Project Structure
Usage
API Endpoints
WebSocket Events
Frontend Client
Testing
Customization
License


Installation

Clone the repository:git clone https://github.com/yourusername/websocket-chat-nest.git
cd websocket-chat-nest


Install dependencies:npm install




Project Structure
websocket-chat-nest/
├── src/
│   ├── chat/
│   │   ├── chat.gateway.ts      # WebSocket gateway (Socket.IO)
│   │   ├── chat.module.ts       # Chat module
│   │   └── chat.controller.ts   # REST API controller
│   ├── types/
│   │   └── message.interface.ts # TypeScript interfaces for messages/users
│   ├── app.controller.ts        # Example root controller
│   ├── app.module.ts            # Root module
│   ├── app.service.ts           # Example service
│   └── main.ts                  # Entry point
├── test/
│   └── app.e2e-spec.ts          # E2E test
├── chat_frontend.html           # Ready-to-use HTML chat client
├── package.json
├── tsconfig.json
├── README.md
└── ...


Usage

Start the Server:npm run start:dev

The server will run on http://localhost:3000.
Open the Frontend:Open chat_frontend.html in your browser. You can open multiple tabs or browsers to simulate multiple users.


API Endpoints
REST Endpoints

Get messages for a room
Method: GET
URL: /chat/messages/:room
Response:{
  "room": "general",
  "messages": [...]
}




Get all connected users
Method: GET
URL: /chat/users
Response:{
  "users": [...]
}






WebSocket Events
Client → Server

joinRoomsocket.emit('joinRoom', { username, room });


sendMessagesocket.emit('sendMessage', 'Hello world!');


typingsocket.emit('typing', true | false);



Server → Client

message: New chat message
previousMessages: Array of last 20 messages in the room
userJoined: Notification when a user joins
userLeft: Notification when a user leaves
roomUsers: Updated list of users in the room
userTyping: Typing indicator
error: Error messages


Frontend Client
A ready-to-use HTML client is provided as chat_frontend.html.
Features:

Join any room with a username
See online users in the room
Real-time chat and typing indicators
Responsive and modern UI

How to use:

Open chat_frontend.html in your browser.
Enter a username and room name (default: general).
Start chatting!


Testing

Run all tests:npm test


Run end-to-end tests:npm run test:e2e




Customization

Production CORS: Update the origin in src/main.ts and src/chat/chat.gateway.ts to your frontend URL.
Persistent Storage: The current implementation stores messages and users in memory. For production, integrate a database (e.g., MongoDB, PostgreSQL).
Authentication: Add authentication (JWT, OAuth, etc.) for secure chat rooms.


License
This project is licensed under the MIT License.
