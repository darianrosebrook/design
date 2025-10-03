/**
 * Mock implementation of the ws module for testing
 */

export class WebSocketServer {
  constructor(options) {
    this.options = options;
    this.clients = new Set();
    this.isListening = false;
  }

  on(event, callback) {
    this.eventHandlers = this.eventHandlers || {};
    this.eventHandlers[event] = callback;
  }

  close(callback) {
    this.isListening = false;
    if (callback) {
      setTimeout(callback, 0);
    }
  }

  // Mock methods for testing
  _triggerConnection(ws) {
    if (this.eventHandlers && this.eventHandlers.connection) {
      this.eventHandlers.connection(ws);
    }
  }

  _triggerError(error) {
    if (this.eventHandlers && this.eventHandlers.error) {
      this.eventHandlers.error(error);
    }
  }
}

export class WebSocket {
  constructor(url, protocols) {
    this.url = url;
    this.protocols = protocols;
    this.readyState = 1; // OPEN
    this.eventHandlers = {};
  }

  on(event, callback) {
    this.eventHandlers[event] = callback;
  }

  send(data) {
    // Mock send - just store the data
    this.lastSent = data;
  }

  close(code, reason) {
    this.readyState = 3; // CLOSED
    if (this.eventHandlers.close) {
      this.eventHandlers.close(code, reason);
    }
  }

  // Mock methods for testing
  _triggerMessage(data) {
    if (this.eventHandlers.message) {
      this.eventHandlers.message({ data });
    }
  }

  _triggerError(error) {
    if (this.eventHandlers.error) {
      this.eventHandlers.error(error);
    }
  }
}

export default {
  WebSocketServer,
  WebSocket,
};
