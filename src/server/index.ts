import { Singleton } from "src/container/Singleton";
import { ExpressHandler } from "./handler/ExpressHandler";

@Singleton
export class Server {
    private expressHandler;
    constructor(expressHandler: ExpressHandler) {
        this.expressHandler = expressHandler;
    }
}