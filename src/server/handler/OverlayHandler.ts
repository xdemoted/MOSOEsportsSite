import { Singleton } from "src/container/Singleton";
import { RawData, WebSocket, WebSocketServer } from "ws";
import { OverlayStorageHandler } from "../storage/handlers/OverlayStorageHandler";
import { Overlay } from "../storage/types/Overlay";

@Singleton
export class OverlayHandler {
    private overlays: { id: string, createdBy: string, }[] = [];

    private wss: WebSocketServer;
    private clients: Map<string, WebSocket[]> = new Map();

    constructor(
        overlayStorage: OverlayStorageHandler
    ) {
        this.wss = new WebSocketServer({ port: Number(process.env.WSS_PORT ?? 8080) });

        this.wss.on("connection", (socket: WebSocket) => {
            console.log("Overlay websocket connected");

            socket.on("message", async (data: RawData, isBinary: boolean) => {
                const message = data.toString()
                const msgParts = message.split(";")
                socket.send("Message: " + message)
                switch (msgParts[0]) {
                    case "id": {
                        if (msgParts.length == 2) {
                            const overlay = await overlayStorage.getOverlay(msgParts[1])
                            if (overlay) {
                                if (this.clients.has(msgParts[1])) {
                                    this.clients.get(msgParts[1])?.push(socket)
                                } else {
                                    this.clients.set(msgParts[1], [socket])
                                }
                                socket.send(JSON.stringify(overlay))
                            } else {
                                socket.send("404: not found")
                            }
                        } else {
                            socket.send("bad request")
                        }
                    }
                }
            });
        });
    }

    public sendUpdate(overlay: Overlay) {
        const client = this.clients.get(overlay.recordID)

        if (client) {
            client.forEach(socket => {
                try {
                    socket.send(JSON.stringify(overlay))
                } catch (error) {
                    
                }
            })
        }
    }
}