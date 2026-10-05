import { Scope } from "src/container/Scope";
import { Singleton } from "src/container/Singleton";
import { DataSource } from "../types/storage/DataSource";

@Singleton
export class StorageHandler {
    private dataHandler?: DataSource;

    constructor(
        private scope: Scope
    ) {}

    private getDataHandler(): DataSource {
        if (this.dataHandler) return this.dataHandler

        const source = process.env.STORAGE_TYPE
        let dataHandler: DataSource | undefined

        this.scope.get<DataSource>(DataSource).forEach((handler) => {
            if (handler.getSourceName() === source) {
                dataHandler = handler
            }
        })

        if (!dataHandler) {
            throw new Error(`No data source found for ${source}`)
        }

        dataHandler.init()
        this.dataHandler = dataHandler
        return dataHandler
    }

    public getUser(id: string) {
        return this.getDataHandler().getUser(id)
    }

    public removeUser(id: string) {
        return this.getDataHandler().removeUser(id)
    }

    public updateUser(user: any) {
        return this.getDataHandler().updateUser(user)
    }
}