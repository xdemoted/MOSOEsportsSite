import { Scope } from "src/container/Scope";
import { Singleton } from "src/container/Singleton";
import { DataSource } from "../types/storage/DataSource";
import { CompleteableFuture } from "src/utility/CompletableFuture";
import { UserCredentials } from "../types/storage/UserCredentials";

@Singleton
export class StorageHandler {
    private dataHandler: CompleteableFuture<DataSource> = new CompleteableFuture<DataSource>();

    constructor(
        scope: Scope
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

    public getUser(id: string) {
        const future = new CompleteableFuture<UserCredentials | undefined>()
        
        this.getDataHandler().then(source => {
            source.getUser(id).onComplete(value => {
                future.complete(value)
            })
        })

        return future;
    }

    public async removeUser(id: string) {
        return (await this.getDataHandler()).removeUser(id)
    }

    public async updateUser(user: any) {
        return (await this.getDataHandler()).updateUser(user)
    }
}