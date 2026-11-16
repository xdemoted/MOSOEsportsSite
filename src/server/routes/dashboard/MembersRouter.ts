import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "src/server/handler/ExpressHandler";
import fs from "fs"
import { Permission } from "src/server/types/Permission";

@Singleton
export class MembersRouter {
    constructor(expressHandler: ExpressHandler) {
        const app = expressHandler.getApp()

        app.get("/dashboard/members", expressHandler.requireAuth(Permission.DASHBOARD_ACCESS), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/members/members.html"))
        })
    }
}