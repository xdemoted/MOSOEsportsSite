import { Singleton } from "src/container/Singleton";
import fs from "fs";

@Singleton
export class Logger {
    constructor() {
        if (!fs.existsSync("./log.txt")) {
            fs.writeFileSync("./log.txt", "")
            Logger.log("Log file created")
        }
    }

    public static log(message: string) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;
        fs.appendFileSync('log.txt', logMessage);
    }
}