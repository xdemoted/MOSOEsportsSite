import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "../handler/ExpressHandler";
import { StorageHandler } from "../handler/StorageHandler";
import { AppAuthHandler } from "../handler/AppAuthHandler";

@Singleton
export class UserRouter {
    constructor(
        expressHandler: ExpressHandler,
        storageHandler: StorageHandler,
        appAuthHandler: AppAuthHandler,
    ) {
        const app = expressHandler.getApp()

        app.get("/api/user/:id", async (req, res) => {
            let userId = req.params.id

            const authenticatedUserId = appAuthHandler.checkAuth(req)
            if (authenticatedUserId) {
                if (userId == "me") {
                    userId = authenticatedUserId
                } else if (userId !== authenticatedUserId) {
                    res.status(403).json({ error: "Forbidden" }) // #TODO Permissions Test for Admins
                    return
                }

                const user = await storageHandler.getUser(userId).getValue()

                if (user) {
                    res.json({
                        id: user.getID(),
                        username: user.getUsername(),
                        displayname: user.getDisplayName()
                    })
                }
            } else {
                res.status(401).json({ error: "Unauthorized" })
                return
            }
        })
    }
}