import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "../../handler/ExpressHandler";
import { Permission } from "../../types/Permission";
import fs from "fs"

@Singleton
export class OverlayRouter {
    constructor(
        expressHandler: ExpressHandler
    ) {
        const app = expressHandler.getApp()

        app.get("/dashboard/overlays", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/overlays/overlays.html"))
        })

        app.get("/api/overlays", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            
        })
    }
}