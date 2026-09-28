export class Bean {
    public name: string;
    public dependencies: string[];
    public clazz: NewableFunction;

    constructor(name: string, dependencies: string[], clazz: NewableFunction) {
        this.name = name;
        this.dependencies = dependencies;
        this.clazz = clazz;
    }
}

export class InitializedBean {
    public name: string;
    public instance: unknown;

    constructor(name: string, instance: unknown) {
        this.name = name;
        this.instance = instance;
    }
}