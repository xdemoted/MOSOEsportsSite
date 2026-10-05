import { Singleton } from "src/container/Singleton";
import { DataSource } from "../types/storage/DataSource";
import { UserCredentials } from "../types/storage/UserCredentials";
import fs from "fs"
import readline from "readline"
import { CompleteableFuture } from "src/utility/CompletableFuture";
import { json } from "stream/consumers";

@Singleton
export class JSONDataSource extends DataSource {
    private changes: Map<string, UserCredentials> = new Map()
    private regex = /^\d+$/
    private isSaving = false;

    public getSourceName(): string {
        return "JSON"
    }

    public override init(): void {
        if (!fs.existsSync("./data.jsonl")) {
            fs.writeFileSync("./data.jsonl", "")
        }

        setInterval(() => {
            if (this.isSaving || this.changes.size == 0) return;
            this.save()
        }, 1 * 10 * 1000)
    }

    public override getUser(id: string): CompleteableFuture<UserCredentials | undefined> {
        const future = new CompleteableFuture<UserCredentials | undefined>

        const foundUser = this.changes.get(id)

        if (foundUser) {
            future.complete(foundUser)
            return future;
        }

        const file = readline.createInterface({
            input: fs.createReadStream('./data.jsonl'),
            output: process.stdout,
            terminal: false
        });

        file.on('line', (line) => {
            if (line.startsWith(`{"id":"${id}`)) {
                file.close()
                future.complete(UserCredentials.fromJSON(JSON.parse(line)))
            }
        });

        return future;
    }

    public override removeUser(id: string): boolean {
        throw new Error()
    }

    public override updateUser(user: UserCredentials): boolean {
        this.changes.set(user.getID(), user);
        return true;
    }

    public save() {
        if (this.isSaving) return false
        this.isSaving = true
        console.log("Saving changes to data.jsonl...")
        const changesToSave = new Map(this.changes)
        const changesToWrite = new Map(changesToSave)
        let writeFailed = false

        const rl = readline.createInterface({
            input: fs.createReadStream('./data.jsonl')
        });

        const output = fs.createWriteStream('data.jsonl.tmp');

        rl.on('line', (line: string) => {
            const splitLine = line.split(`"`)

            if (splitLine.length > 4) {
                const id = splitLine[3]
                if (id.match(this.regex)) {
                    const result = changesToWrite.get(id)

                    if (result) {
                        output.write(`${JSON.stringify(result)}\n`)
                        changesToWrite.delete(id)
                        return;
                    }
                }
            }

            output.write(line + "\n")
        });

        rl.on('close', () => {
            changesToWrite.forEach((value) => {
                output.write(JSON.stringify(value) + "\n")
            })

            output.end();
        });

        output.on('error', (error) => {
            writeFailed = true
            console.error('Failed to write data.jsonl.tmp:', error)
            this.isSaving = false
        });

        output.on('close', () => {
            if (writeFailed) return

            fs.rename('data.jsonl.tmp', 'data.jsonl', (error) => {
                if (error) {
                    console.error('Failed to replace data.jsonl:', error)
                } else {
                    changesToSave.forEach((value, id) => {
                        if (this.changes.get(id) === value) this.changes.delete(id)
                    })
                }

                this.isSaving = false
            })
        });

        return true;
    }
}
/*
console.log(JSON.stringify(new UserCredentials("316243027423395841", "demoted.", "Eve", "", "", 604800)))
const source = new JSONDataSource()
source.getUser("316243027423395841").onComplete(async value => {
    if (!value) return;
    source.updateUser(new UserCredentials("1519762775596077229", "fkdcd_", "pynix", "", "", 604800))
    source.updateUser(new UserCredentials("912331", "EEEEEEEE", "EEEVE", "VAPOREON", "", 123131231))
    source.save()
})
*/

