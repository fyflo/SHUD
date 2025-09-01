const { Server } = require("socket.io");

class WebSocketManager {
  constructor() {
    this.io = null;
    this.ioHttps = null;
    this.clients = new Set();
  }

  initialize(server, httpsServer = null) {
    // HTTP WebSocket
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    // HTTPS WebSocket (если есть)
    if (httpsServer) {
      this.ioHttps = new Server(httpsServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });
    }

    this.setupEventHandlers();
  }

  setupEventHandlers() {
    const setupSocket = (socket, type) => {
      console.log(`Новое подключение к ${type} WebSocket`);

      this.clients.add(socket);

      socket.on("ready", () => {
        console.log(`Клиент на ${type} отправил ready`);
        // Здесь можно добавить логику для отправки начальных данных
      });

      socket.on("disconnect", () => {
        console.log(`Клиент отключился от ${type} WebSocket`);
        this.clients.delete(socket);
      });

      socket.on("hud_data", (data) => {
        console.log(`Получены hud_data через ${type} WebSocket:`, data.type);
        this.broadcastToAll("hud_data", data);
      });
    };

    if (this.io) {
      this.io.on("connection", (socket) => setupSocket(socket, "HTTP"));
    }

    if (this.ioHttps) {
      this.ioHttps.on("connection", (socket) => setupSocket(socket, "HTTPS"));
    }
  }

  broadcastToAll(event, data) {
    if (this.io) {
      this.io.emit(event, data);
    }
    if (this.ioHttps) {
      this.ioHttps.emit(event, data);
    }
  }

  getConnectedClients() {
    return this.clients.size;
  }

  disconnectAll() {
    if (this.io) {
      this.io.disconnectSockets();
    }
    if (this.ioHttps) {
      this.ioHttps.disconnectSockets();
    }
    this.clients.clear();
  }
}

module.exports = WebSocketManager; 