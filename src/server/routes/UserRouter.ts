import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "../handler/ExpressHandler";
import { StorageHandler } from "../storage/StorageHandler";
import { AppAuthHandler } from "../handler/AppAuthHandler";
import { PermissionsHandler } from "../handler/PermissionsHandler";
import { Permission } from "../types/Permission";
import { DiscordHandler } from "../handler/DiscordHandler";
import { UserStorageHandler } from "../storage/handlers/UserStorageHandler";

@Singleton
export class UserRouter {
    constructor(
        expressHandler: ExpressHandler,
        userStorageHandler: UserStorageHandler,
        appAuthHandler: AppAuthHandler,
        permissionHandler: PermissionsHandler,
        discordHandler: DiscordHandler
    ) {
        const app = expressHandler.getApp()

        app.get("/api/user/:id", async (req, res) => {
            let userId = req.params.id

            const authenticatedUserId = appAuthHandler.checkAuth(req, res)
            if (authenticatedUserId) {
                if (userId == "me") {
                    userId = authenticatedUserId
                } else if (userId !== authenticatedUserId) {
                    const hasPermission = await permissionHandler.hasPermission(authenticatedUserId, Permission.VIEW_USERS)
                    console.log(`User ${authenticatedUserId} requested info for user ${userId}. Permissions: ${await permissionHandler.getUserPermissions(authenticatedUserId)}. Has VIEW_USERS: ${hasPermission}`)
                    if (!hasPermission) {
                        res.status(403).json({ error: "Forbidden" })
                        return
                    }
                }

                const user = await userStorageHandler.getUser(userId)

                if (user) {
                    res.json({
                        id: user.getDiscordID(),
                        username: user.getUsername(),
                        displayname: user.getDisplayName(),
                        permissions: await permissionHandler.getUserPermissions(userId)
                    })
                } else {
                    res.status(404).json({ error: "User not found" })
                }
            } else {
                res.status(401).json({ error: "Unauthorized" })
                return
            }
        })

        app.get("/api/user/:id/avatar", async (req, res) => {
            let userId = req.params.id

            const authenticatedUserId = appAuthHandler.checkAuth(req, res)
            if (authenticatedUserId) {
                if (userId == "me") {
                    userId = authenticatedUserId
                }

                const user = await userStorageHandler.getUser(userId)

                if (user) {
                    const member = await discordHandler.getGuildMember(userId)

                    if (member && member.user && member.user.avatarURL()) {
                        const avatarUrl = member.user.avatarURL()
                        if (avatarUrl) {
                            res.redirect(avatarUrl)
                        } else {
                            res.status(404).json({ error: "Avatar not found" })
                        }
                    }
                } else {
                    res.status(404).json({ error: "User not found" })
                }
            } else {
                res.status(401).json({ error: "Unauthorized" })
                return
            }
        })
    }
}