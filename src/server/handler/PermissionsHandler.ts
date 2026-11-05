import { Singleton } from "src/container/Singleton";
import { DiscordHandler } from "./DiscordHandler";
import { Permission } from "../types/Permission";

@Singleton
export class PermissionsHandler {
    private rolePermissions: Map<string, number> = new Map()
    .set("1089666460974071818", 127) // Executive Council
    .set("1479153526960558151", 11) // Stream Team
    .set("1179861558239699114", 11) // Captain
    .set("1408207270981926974", 1) // Member
    private userCache: Map<string, number> = new Map();

    constructor(
        private discordHandler: DiscordHandler
    ) {
        discordHandler.onGuildMemberAdd(member => {
            this.userCache.delete(member.id);
        });

        discordHandler.onGuildMemberRemove(member => {
            this.userCache.delete(member.id);
        });

        discordHandler.onGuildMemberUpdate((oldMember, newMember) => {
            if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
                this.userCache.delete(newMember.id);
            }
        });
    }

    public async getUserPermissions(userId: string): Promise<number> {
        if (this.userCache.has(userId)) {
            return this.userCache.get(userId) as number;
        }

        const member = await this.discordHandler.getGuildMember(userId);

        if (!member) {
            return 0;
        }

        let permissions = 0;

        member.roles.cache.forEach(role => {
            if (this.rolePermissions.has(role.id)) {
                permissions |= this.rolePermissions.get(role.id) as number;
            }
        });

        this.userCache.set(userId, permissions);
        return permissions;
    }

    public async hasPermission(userId: string, permission: Permission): Promise<boolean> {
        const userPermissions = await this.getUserPermissions(userId);
        return (userPermissions & permission) === permission;
    }
}