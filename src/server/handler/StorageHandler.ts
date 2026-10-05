import { Scope } from "src/container/Scope";
import { Singleton } from "src/container/Singleton";
import { DataSource } from "../types/storage/DataSource";
import { CompleteableFuture } from "src/utility/CompletableFuture";

@Singleton
export class StorageHandler {
    private dataHandler: CompleteableFuture<DataSource> = new CompleteableFuture<DataSource>();

    constructor(
        private scope: Scope
    ) {
        scope.getAsync<DataSource>(DataSource).then((handlers) => {
            handlers.forEach((handler) => {
                if (handler.getSourceName() === process.env.STORAGE_TYPE) {
                    this.dataHandler?.complete(handler)
                }
            })

            if (!this.dataHandler) {
                throw new Error(`No data source found for ${process.env.STORAGE_TYPE}`)
            }

            this.dataHandler.onComplete(dataSource => dataSource.init())
        })
    }

    private async getDataHandler(): Promise<DataSource> {
        return await this.dataHandler.getValue()
    }

    public async getUser(id: string) {
        return (await this.getDataHandler()).getUser(id)
    }

    public async removeUser(id: string) {
        return (await this.getDataHandler()).removeUser(id)
    }

    public async updateUser(user: any) {
        return (await this.getDataHandler()).updateUser(user)
    }
}