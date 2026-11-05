import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "src/server/handler/ExpressHandler";
import fs from "fs"
import { Permission } from "src/server/types/Permission";

@Singleton
export class OverviewRouter {
    constructor(expressHandler: ExpressHandler) {
        const app = expressHandler.getApp()

        app.get("/dashboard/overview", expressHandler.requireAuth(Permission.DASHBOARD_ACCESS), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/overview.html"))
        })

        app.get("/dashboard", async (req, res) => {
            res.redirect("/dashboard/overview")
        }) 
    }
}