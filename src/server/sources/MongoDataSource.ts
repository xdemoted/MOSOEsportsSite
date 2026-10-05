import { Collection, Db, MongoClient, WithId } from "mongodb";
import { UserCredentials } from "../types/storage/UserCredentials";
import { Singleton } from "src/container/Singleton";
import { CompleteableFuture } from "src/utility/CompletableFuture";
import { DataSource } from "../types/storage/DataSource";

@Singleton
export default class MongoDataSource extends DataSource {
    private database: CompleteableFuture<Db> = new CompleteableFuture<Db>();
    private collections: {[id: string]: Collection} = {};

    public override getSourceName() {
        return "MONGO"
    }

    public override async init() {
        await this.connect();
    }

    public override async getUser(id: string) {

    }

    public override async updateUser(user: UserCredentials) {

    }

    public override async removeUser(id: string) {

    }

    public async connect(): Promise<void> {
        const uri = process.env.DB_CONN_STRING;

        if (!uri) {
            throw new Error("MongoDB URI is not defined in environment variables.");
        }

        const client = new MongoClient(uri);
        try {
            await client.connect();
            this.database.complete(client.db(process.env.DB_NAME));
            console.log("Connected to MongoDB successfully.");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw error;
        }

        if (!this.database) {
            throw new Error("Failed to select the database.");
        }

        

        process.on('SIGINT', async () => {
            await client.close();
            process.exit(0);
        });
    }

    public getDatabase(): CompleteableFuture<Db> {
        return this.database;
    }
}