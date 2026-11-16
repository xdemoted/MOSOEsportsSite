import { StorageHandler } from "../StorageHandler";
import { DataRecord } from "../types/DataRecord";

export abstract class AbstractStorageHandler<T extends DataRecord> {
    private dataSource

    constructor(private storageHandler: StorageHandler) {
        this.dataSource = storageHandler.getDataHandler()
    }

    public abstract getTableName(): string

    public async getValue(recordID: string): Promise<T | null> {
        return await (await this.dataSource).getValue(this.getTableName(), recordID) as unknown as T | null
    }

    public async removeValue(recordID: string): Promise<boolean> {
        return await (await this.storageHandler.getDataHandler()).removeValue(this.getTableName(), recordID) 
    }

    public async updateValue(record: T): Promise<boolean> {
        return await (await this.storageHandler.getDataHandler()).updateValue(this.getTableName(), record)
    }

    public async getTable() {
        return await (await this.storageHandler.getDataHandler()).getTable(this.getTableName()) as unknown as T[] | null
    }
}