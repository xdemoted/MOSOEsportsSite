import { Singleton } from "src/container/Singleton";
import { User } from "../types/User";
import { StorageHandler } from "../StorageHandler";
import { AbstractStorageHandler } from "./AbstractStorageHandler";

@Singleton
export class UserStorageHandler extends AbstractStorageHandler<User> {
    constructor (storageHandler: StorageHandler) {
        super(storageHandler)
    }

    public override getTableName(): string {
        return "users"
    }

    public async getUser(userID: string) {
        return User.fromRecord(await this.getValue(userID))
    }

    public async removeUser(userID: string) {
        return this.removeValue(userID)
    }

    public async updateUser(user: User) {
        return this.updateValue(user)
    }

    public getUsers() {
        return this.getTable()
    }
}