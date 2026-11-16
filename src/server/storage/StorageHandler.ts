import { Scope } from "src/container/Scope";
import { Singleton } from "src/container/Singleton";
import { DataSource } from "./types/DataSource";
import { CompleteableFuture } from "src/utility/CompletableFuture";
import { User } from "./types/User";

@Singleton
export class StorageHandler {
    private dataHandler: CompleteableFuture<DataSource> = new CompleteableFuture<DataSource>();

    constructor(
        scope: Scope
    ) {
        scope.getAsync<DataSource>(DataSource).then((handlers) => {
            let foundHandler: DataSource | undefined;

            handlers.forEach((handler) => {
                if (handler.getSourceName() === process.env.STORAGE_TYPE) {
                    foundHandler = handler;
                }
            })

            if (!foundHandler) {
                throw new Error(`No data source found for ${process.env.STORAGE_TYPE}`)
            }

            this.dataHandler.complete(foundHandler)
            this.dataHandler.onComplete(dataSource => dataSource.init())
        })
    }

    public async getDataHandler(): Promise<DataSource> {
        return await this.dataHandler.getValue()
    }
}