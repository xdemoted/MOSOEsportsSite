import { Singleton } from "src/container/Singleton";
import { DataSource } from "../types/DataSource";
import { User } from "../types/User";
import fs from "fs";
import { CompleteableFuture } from "src/utility/CompletableFuture";
import { resolve } from "dns";
import { DataRecord } from "../types/DataRecord";

@Singleton
export class JSONDataSource extends DataSource {
    private cache: { [id: string]: DataRecord[] } = {}

    public getSourceName(): string {
        return "JSON"
    }

    public async updateCache() {
        try {
            const file = await fs.readFile.__promisify__('./data.json',{encoding: 'utf-8'})
            this.cache = JSON.parse(file)
        } catch (error) {
            console.log(error)
        }
    }

    public save() {
        fs.writeFile('./data.json', JSON.stringify(this.cache), (err) => {
            console.log(err)
        })
    }

    public override init(): void {
        if (!fs.existsSync("./data.json")) {
            fs.writeFileSync("./data.json", "")
        }

        this.updateCache()

        setInterval(() => {
            this.save()
        }, 1 * 10 * 1000)
    }

    public override getValue(tableName: string, id: string): Promise<DataRecord | null> {
        return new Promise((resolve, reject) => {
            const table = this.cache[tableName]

            if (!table) return resolve(null)

            const result = table.find(record => {record.recordID == id})

            resolve(result ? result : null)
        })
    }

    public override removeValue(tableName: string, id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const table = this.cache[tableName]

            if (!table) return resolve(false)

            const result = table.findIndex(record => {record.recordID == id})

            if (result == -1) return resolve(false)

            table.splice(result, 1)

            resolve(true)
        })
    }

    public override updateValue(tableName: string, record: DataRecord): Promise<boolean> {
        return new Promise((resolve, reject) => {
            let table = this.cache[tableName]

            if (!table) {
                table = [record]
                return resolve(true)
            }

            const result = table.findIndex(tableRecord => {tableRecord.recordID == record.recordID})

            if (result == -1) {
                table.push(record)
                return resolve(true)
            } else {
                table[result] = record
            }
        })
    }
}

