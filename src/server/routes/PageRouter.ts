import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "../handler/ExpressHandler";

@Singleton
export class PageRouter {
    constructor(
        expressHandler: ExpressHandler
    ) {
        expressHandler.getApp().get("/schedule", (req, res) => {
            res.sendFile("public/views/schedule.html", { "root": '.' })
        })
    }
}