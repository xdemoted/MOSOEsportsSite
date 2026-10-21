import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "../handler/ExpressHandler";
import { CalendarHandler } from "../handler/CalendarHandler";

@Singleton
export class CalendarRouter {
    constructor(
        expressHandler: ExpressHandler,
        calendarHandler: CalendarHandler
    ) {
        const app = expressHandler.getApp()

        app.use("/api/calendar", (req, res, next) => {
            if (req.query.raw) {
                res.send(calendarHandler.getEvents())
            } else {
                res.send(calendarHandler.getCompressedEvents())
            }
        })
    }
}