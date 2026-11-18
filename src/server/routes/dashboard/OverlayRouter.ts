import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "../../handler/ExpressHandler";
import { Permission } from "../../types/Permission";
import fs from "fs"
import { Overlay, OverlayTeam } from "src/server/storage/types/Overlay";
import { AppAuthHandler } from "src/server/handler/AppAuthHandler";
import { randomInt, randomUUID } from "crypto";
import { OverlayStorageHandler } from "src/server/storage/handlers/OverlayStorageHandler";
import { OverlayHandler } from "src/server/handler/OverlayHandler";

@Singleton
export class OverlayRouter {
    constructor(
        expressHandler: ExpressHandler,
        appAuthHandler: AppAuthHandler,
        overlayStorage: OverlayStorageHandler,
        overlayHandler: OverlayHandler
    ) {
        const app = expressHandler.getApp()

        app.get("/dashboard/overlays", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/overlays/overlays.html"))
        })

        app.get("/dashboard/overlays/:id", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/overlays/edit.html"))
        })

        app.get("/dashboard/overlays/new", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            const html = fs.readFileSync("./protected/views/navigation.html", "utf-8")
            res.send(html.replace("{{dataurl}}", "/protected/pages/overlays/new.html"))
        })

        app.get("/api/overlays", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            try {
                const overlays = await overlayStorage.getOverlays()

                if (overlays) {
                    res.status(200).send(overlays)
                } else {
                    res.status(500).send("error")
                }
            } catch {

            }
        })

        app.get("/api/overlays/:id", async (req, res) => {
            const overlayID = req.params.id
            
            try {
                const overlay = await overlayStorage.getOverlay(overlayID)

                if (overlay) {
                    res.status(200).send(JSON.stringify(overlay))
                } else {
                    res.status(404).send("Not found")
                }
            } catch (error) {
                res.status(500).send(error)
            }
        })

        app.get("/overlays/:id", async (req, res) => { // Used in OBS - No Auth
            const overlayID = req.params.id
            console.log(overlayID)
            res.sendFile("protected/assets/overlays/Rivals.html", { "root": '.' }) // TODO: Auto serve by type
        })

        app.post("/api/overlays/new", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            try {
                const data = req.body

                if (
                    typeof data.overlaytype == 'string' &&
                    typeof data.division == 'string' &&
                    typeof data.match == 'string' &&
                    typeof data.bestOf == 'string' &&
                    typeof data.homeName == 'string' &&
                    typeof data.homeColor == 'string' &&
                    typeof data.homeURL == 'string' &&
                    typeof data.homeDesc == 'string' &&
                    typeof data.awayName == 'string' &&
                    typeof data.awayColor == 'string' &&
                    typeof data.awayURL == 'string' &&
                    typeof data.awayDesc == 'string' &&
                    typeof data.roundsPerSeries == 'string' &&
                    typeof data.roundsToWin == 'string' &&
                    typeof data.seriesPerMatch == 'string' &&
                    typeof data.seriesToWin == 'string'
                ) {
                    const userID = appAuthHandler.checkAuth(req, res)
                    if (!userID) return;

                    if (typeof data.homeDesc2 == "string") data.homeDesc += " ● " + data.homeDesc2;
                    if (typeof data.awayDesc2 == "string") data.awayDesc += " ● " + data.awayDesc2;

                    const overlay: Overlay = new Overlay(
                        randomUUID(), userID, Date.now(), data.overlaytype, data.division, data.match, data.bestOf, new OverlayTeam(data.homeName, data.homeColor, data.homeURL, data.homeDesc), new OverlayTeam(data.awayName, data.awayColor, data.awayURL, data.awayDesc), data.roundsPerSeries, data.roundsToWin, data.seriesPerMatch, data.seriesToWin
                    )

                    overlay.rounds = []

                    overlayStorage.updateOverlay(overlay)

                    res.send(overlay.recordID)
                } else {
                    res.status(400)
                    res.send(new Error('Missing required properties'))
                }
            } catch (error) {
                console.log(error)
                res.status(500)
                res.send(error)
                return;
            }
        })

        app.post("/api/overlay/swap", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            console.log(req.body)
            const data = req.body.id

            try {
                const overlay = await overlayStorage.getOverlay(data)

                if (overlay) {
                    const home = { ...overlay.homeTeam }
                    const away = { ...overlay.awayTeam }

                    overlay.homeTeam = away

                    overlay.homeTeam.teamDesc = overlay.homeTeam.teamDesc.replace("Away", "Home")

                    overlay.awayTeam = home

                    overlay.awayTeam.teamDesc = overlay.awayTeam.teamDesc.replace("Home", "Away")

                    overlayStorage.updateOverlay(overlay)
                    overlayHandler.sendUpdate(overlay)
                    res.status(200).send(JSON.stringify(overlay))
                } else {
                    res.status(404).send("Not Found")
                }
            } catch (error) {
                res.status(500).send(error)
            }
        })

        app.post("/api/overlay/update", expressHandler.requireAuth(Permission.OVERLAY_MANAGE), async (req, res) => {
            console.log(req.body)
            const id = req.body.id
            const rounds = req.body.rounds

            try {
                const overlay = await overlayStorage.getOverlay(id)

                if (overlay) {
                    overlay.rounds = rounds

                    overlayStorage.updateOverlay(overlay)
                    overlayHandler.sendUpdate(overlay)
                    res.status(200).send(JSON.stringify(overlay))
                } else {
                    res.status(404).send("Not Found")
                }
            } catch (error) {
                res.status(500).send(error)
            }
        })
    }
}