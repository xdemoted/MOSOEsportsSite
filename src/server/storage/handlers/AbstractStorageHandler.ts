import { StorageHandler } from "../StorageHandler";
import { DataRecord } from "../types/DataRecord";

export abstract class AbstractStorageHandler<T extends DataRecord> {
    private dataSource

    constructor(private storageHandler: StorageHandler) {
        this.dataSource = storageHandler.getDataHandler()
    }

    public abstract getTable(): string

    public async getValue(recordID: string): Promise<T | null> {
        return await (await this.dataSource).getValue(this.getTable(), recordID) as unknown as T | null
    }

    public async removeValue(recordID: string): Promise<boolean> {
        return await (await this.storageHandler.getDataHandler()).removeValue(this.getTable(), recordID) 
    }

    public async updateValue(record: T): Promise<boolean> {
        return await (await this.storageHandler.getDataHandler()).updateValue(this.getTable(), record)
    }
}