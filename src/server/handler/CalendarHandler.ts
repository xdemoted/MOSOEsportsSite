import axios from "axios"
import { CalendarEvent } from "../api/calendar/CalendarEvent";

export class CalendarHandler {
    private NECC_URI = process.env.NECC_URI
    private cachedEvents: CalendarEvent[] | undefined = []

    constructor() {
        this.getCalendarData().then((events) => {
            this.cachedEvents = events
            setInterval(
                async () => { this.cachedEvents = await this.getCalendarData() },
                parseInt(process.env.UPDATE_DELAY as string) * 60 * 1000
            )
        })
    }

    public async getCalendarData() {
        if (!this.NECC_URI) return;
        console.log(this.NECC_URI)
        const data = (await axios.get(this.NECC_URI)).data

        const lines: string[] = data.split("\n")

        const events = []

        let event: CalendarEvent | undefined = new CalendarEvent();
        let eventStart = -1;
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];

            if (!event) {
                if (line.startsWith("BEGIN:VEVENT")) {
                    event = new CalendarEvent();
                }
            } else if (line.startsWith("END:VEVENT")) {
                events.push(event)
                event = undefined
            } else {
                if (line.startsWith("UID:")) {
                    event.uid = line.slice(4).replace("\r", "")
                } else if (line.startsWith("SUMMARY:")) {
                    event.name = line.slice(8).replace("\r", "")
                } else if (line.startsWith("DTSTAMP:")) {
                    event.stamp = CalendarHandler.formatISOTime(line.slice(8).replace("\r", "")) / 1000
                } else if (line.startsWith("DTSTART:")) {
                    event.start = CalendarHandler.formatISOTime(line.slice(8).replace("\r", "")) / 1000
                } else if (line.startsWith("DTEND:")) {
                    event.end = CalendarHandler.formatISOTime(line.slice(6).replace("\r", "")) / 1000
                } else if (line.startsWith("URL;VALUE=URI:")) {
                    event.uri = line.slice(14).replace("\r", "")
                }
            }
        }

        return events;
    }

    public getEvents() {
        return this.cachedEvents
    }

    public static formatISOTime(input: string) {
        const chars = input.split("")
        // 20261020T231521Z

        chars.splice(4, 0, "-")
        chars.splice(7, 0, "-")

        chars.splice(13, 0, ":")
        chars.splice(16, 0, ":")

        // 2026-10-20T23:15:21Z
        return Date.parse(chars.join(""))
    }
}

require('@dotenvx/dotenvx').config()
new CalendarHandler().getCalendarData()