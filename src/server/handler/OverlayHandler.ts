import { Singleton } from "src/container/Singleton";
import { RawData, WebSocket, WebSocketServer } from "ws";

@Singleton
export class OverlayHandler {
    private overlays: { id: string, createdBy: string,  }[] = [];

    private wss: WebSocketServer;
    private clients: Map<string, WebSocket[]> = new Map();

    constructor() {
        this.wss = new WebSocketServer({ port: Number(process.env.WSS_PORT ?? 8080) });

        this.wss.on("connection", (socket: WebSocket) => {
            console.log("Overlay websocket connected");

            socket.on("message", (data: RawData, isBinary: boolean) => {
                const message = data.toString()
                const msgParts = message.split(";")
                socket.send("Message: " + message)
                switch (msgParts[0]) {
                    case "id": {
                        if (msgParts.length == 2 && this.overlays.find(overlay => overlay.id == msgParts[1])) {
                            if (this.clients.has(msgParts[1])) {
                                this.clients.get(msgParts[1])?.push(socket)
                            } else {

                            }
                            socket.send("ack")
                        } else {
                            socket.send("err: no overlay found")
                        }
                    }
                }
            });
        });
    }
}