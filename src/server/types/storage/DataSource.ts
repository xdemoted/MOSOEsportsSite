import { CompleteableFuture } from "src/utility/CompletableFuture";
import { UserCredentials } from "./UserCredentials";

// Return false when data can not be changed
export abstract class DataSource {
    public abstract init(): void;
    public abstract getUser(id: string): CompleteableFuture<UserCredentials | undefined>;
    public abstract removeUser(id: string): boolean;
    public abstract updateUser(user: UserCredentials): boolean;
    public abstract getSourceName(): string;
}