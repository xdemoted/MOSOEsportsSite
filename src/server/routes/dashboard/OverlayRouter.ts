import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "../../handler/ExpressHandler";
import { Permission } from "../../types/Permission";
import fs from "fs"
import { Overlay } from "src/server/storage/types/Overlay";
import { AppAuthHandler } from "src/server/handler/AppAuthHandler";
import { randomInt, randomUUID } from "crypto";
import { OverlayStorageHandler } from "src/server/storage/handlers/OverlayStorageHandler";

@Singleton
export class OverlayRouter {
    constructor(
        expressHandler: ExpressHandler,
        appAuthHandler: AppAuthHandler,
        overlayStorage: OverlayStorageHandler
    ) {
        const app = expressHandler.getApp()

        app.get("/dashboard/overlays", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/overlays/overlays.html"))
        })

        app.get("/dashboard/overlays/new", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/overlays/new.html"))
        })

        app.get("/api/overlays", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            try {
                const overlays = await overlayStorage.getOverlays()

                if (overlays) {
                    res.send(overlays)
                } else {
                    res.status(500)
                }
            } catch {

            }
        })

        app.get("/api/overlays/:id", async (req, res) => { // Used in OBS - No Auth
            let overlayID = req.params.id
            console.log(overlayID)
            res.sendFile("protected/assets/overlays/MKWorld.html", { "root": '.' })
        })

        app.post("/api/overlays/new", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            try {
                const data: Overlay = req.body

                if (
                    typeof data.overlaytype == 'string' &&
                    typeof data.t1 == 'string' &&
                    typeof data.t1c == 'string' &&
                    typeof data.t1u == 'string' &&
                    typeof data.t2 == 'string' &&
                    typeof data.t2c == 'string' &&
                    typeof data.t2u == 'string' &&
                    typeof data.rps == 'string' &&
                    typeof data.rtw == 'string' &&
                    typeof data.spm == 'string' &&
                    typeof data.stw == 'string'
                ) {
                    data.rounds = []
                    data.createdAt = Date.now()
                    const userID = appAuthHandler.checkAuth(req, res)

                    if (!userID) return;

                    data.createdBy = userID
                    data.recordID = randomUUID()

                    overlayStorage.updateOverlay(data)
                    res.send(data.recordID)
                } else {
                    res.status(400)
                    res.send(new Error('Missing required properties'))
                }
            } catch (error) {
                console.log(error)
                res.status(400)
                res.send(error)
                return;
            }
        })
    }
}