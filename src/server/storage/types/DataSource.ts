import { CompleteableFuture } from "src/utility/CompletableFuture";
import { User } from "./User";
import { DataRecord } from "./DataRecord";

export abstract class DataSource {
    public abstract init(): void;

    public abstract getValue(tableName: string, id: string): Promise<DataRecord | null>;
    public abstract removeValue(tableName: string, id: string): Promise<boolean>;
    public abstract updateValue(tableName: string, record: DataRecord): Promise<boolean>;
    
    public abstract getSourceName(): string;
}