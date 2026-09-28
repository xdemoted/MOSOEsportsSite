import { Scope } from "src/container/Scope";

require('@dotenvx/dotenvx').config()

/*
Values specified in .env
*/
const defaults = {
    APP_PORT: "3000"
}

process.env = { ...defaults, ...process.env }

Scope.getScope("src/server");

/*
getScope initiates DependencyInjection which is used to automatically map and load
dependencies in the order they're used.
*/