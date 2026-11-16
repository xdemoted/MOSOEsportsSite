import { Collection, Db, MongoClient, WithId } from "mongodb";
import { User } from "../types/User";
import { Singleton } from "src/container/Singleton";
import { CompleteableFuture } from "src/utility/CompletableFuture";
import { DataSource } from "../types/DataSource";
import { DataRecord } from "../types/DataRecord";
import { Data } from "ws";

@Singleton
export default class MongoDataSource extends DataSource {
    private database: CompleteableFuture<Db> = new CompleteableFuture<Db>();

    public getSourceName() {
        return "MONGO"
    }

    public async init() {
        await this.connect();
    }

    public override getValue(tableName: string, id: string): Promise<DataRecord | null> {
        return new Promise(async (resolve, reject) => {
            const collection = (await this.database.getValue()).collection(tableName)

            try {
                resolve((await collection.findOne({ recordID: id })) as DataRecord | null)
            } catch (error) {
                resolve(null)
            }
        })
    }

    public override async updateValue(tableName: string, record: DataRecord): Promise<boolean> {
        try {
            const collection = (await this.database.getValue()).collection(tableName)
            await collection.updateOne(
                { recordID: record.recordID },
                { $set: record },
                { upsert: true }
            )

            return true
        } catch (error) {
            console.error(`Failed to update MongoDB record in "${tableName}":`, error)
            return false
        }
    }

    public override removeValue(tableName: string, id: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            const collection = (await this.database.getValue()).collection(tableName)

            try {
                const result = await collection.deleteOne({ recordID: id })

                if (result.deletedCount == 0) return resolve(false)

                return resolve(true)
            } catch (error) {
                console.log(error)
                return resolve(false)
            }
        })
    }

    public override getTable(tableName: string): Promise<DataRecord[]> {
        return new Promise(async (resolve, reject) => {
            const collection = (await this.database.getValue()).collection(tableName)

            try {
                resolve(await collection.find().toArray() as unknown as DataRecord[])
            } catch (error) {
                return resolve([])
            }
        })
    }

    public async connect(): Promise<void> {
        const uri = process.env.DB_CONN_STRING;

        if (!uri) {
            throw new Error("MongoDB URI is not defined in environment variables.");
        }

        const client = new MongoClient(uri);
        let db;
        try {
            await client.connect();
            db = client.db(process.env.DB_NAME)
            this.database.complete(db);
            console.log("Connected to MongoDB successfully.");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw error;
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