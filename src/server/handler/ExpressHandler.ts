import { Singleton } from "src/container/Singleton";
import express from "express";

@Singleton
export class ExpressHandler {
    private app = express();

    constructor() {
        this.app.listen(process.env.APP_PORT, () => {
            console.log(`Server is running on port ${process.env.APP_PORT}`);
        });

        this.app.use(express.static("public/assets/"))
    }

    public getApp() {
        return this.app;
    }
}