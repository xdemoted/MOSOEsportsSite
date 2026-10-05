import { Scope } from "src/container/Scope";

require('@dotenvx/dotenvx').config()

/*
Values specified in .env
*/
const defaults = {
    APP_PORT: "3000",
    BASE_URL: "http://localhost:25551",
    STORAGE_TYPE: "JSON",
}

const requires = [
    "CLIENT_ID",
    "CLIENT_SECRET"
]

let missing = ""

requires.forEach(str => {
    if (!process.env[str]) missing += `\nMissing Variable: ${str}`;
})

if (missing != "") {
    throw new Error(missing)
}

process.env = { ...defaults, ...process.env }

Scope.getScope("src/server");

/*
getScope initiates DependencyInjection which is used to automatically map and load
dependencies in the order they're used.
*/