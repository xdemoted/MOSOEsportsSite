import { CompleteableFuture } from "src/utility/CompletableFuture";
import { Bean, InitializedBean } from "src/container/Bean";
import fs from "fs";
import { resolve } from "path";
import "reflect-metadata"

export class Scope {
    private parent?: Scope;
    private beans: InitializedBean[] = [];
    private complete: boolean = false;
    private static readonly INTERNAL_SCOPE_DEPENDENCY = "Scope"

    private constructor(private rootDir: string, parent?: Scope) { // Not safe to call directly, use Scope.getScope() instead
        this.parent = parent

        this.discoverBeans().onComplete(beans => {
            const resolution = this.resolveInitializationOrder(beans)
            if (resolution.missing.length > 0 && this.parent) {
                const parentDependencies = this.parent.supplyDependencies(resolution.missing)
                this.beans.push(...parentDependencies)
            }

            beans = resolution.resolved

            this.displayTierGraph(beans)
            this.instantiateBeans(beans)

            this.complete = true
        })
    }

    

    private listDependencies(clazz: Function) {
        return Reflect.getMetadata("design:paramtypes", clazz) ?? []
    }

    private discoverBeans(): CompleteableFuture<Bean[]> {
        const future = new CompleteableFuture<Bean[]>();

        const discover = async (dir: string): Promise<Bean[]> => {
            const files = fs.readdirSync(dir)
            const classes: Bean[] = []

            for (const file of files) {
                if (file == "container") continue
                else if (file == "web") continue
                else if (!file.includes(".")) {
                    if (fs.lstatSync(`${dir}/${file}`).isDirectory())
                        (await discover(`${dir}/${file}`)).forEach(cls => classes.push(cls))
                    continue;
                }
                else if (!(file.endsWith(".ts"))) continue

                try {
                    const resolvedFile = resolve(dir, file)
                    const mod = require(resolvedFile)

                    for (const key of Object.keys(mod)) {
                        const exported = mod[key]

                        if (typeof exported === "function" && exported.prototype && "singleton" in exported) {
                            const dependencyNames = this.listDependencies(exported)
                                .map((dep: any) => (dep && dep.name ? dep.name : undefined))
                                .filter((name: string): name is string => Boolean(name))
                            classes.push(new Bean(exported.name, dependencyNames, exported))
                        }
                    }
                } catch (err) {
                    console.error(`Failed to load classes from ${dir}/${file}:`, err)
                }
            }

            return classes
        }

        discover(this.rootDir).then(beans => future.complete(beans))

        return future;
    }

    private createBeanMap(beans: Bean[]) {
        const byName = new Map<string, Bean>()

        for (const bean of beans) {
            if (byName.has(bean.name)) {
                throw new Error(`Duplicate bean name detected: ${bean.name}`)
            }
            byName.set(bean.name, bean)
        }

        return byName
    }

    private resolveInitializationOrder(beans: Bean[]): {resolved: Bean[], missing: string[]} {
        const byName = this.createBeanMap(beans)
        const visiting = new Set<string>()
        const visited = new Set<string>()
        const order: Bean[] = []
        const missingDependencies = new Set<string>()

        const visit = (beanName: string, trail: string[]) => {
            if (visited.has(beanName)) return

            if (visiting.has(beanName)) {
                const cycleStartIndex = trail.indexOf(beanName)
                const cycle = [...trail.slice(cycleStartIndex), beanName].join(" -> ")
                throw new Error(`Circular dependency detected: ${cycle}`)
            }

            const bean = byName.get(beanName)
            if (!bean) {
                missingDependencies.add(beanName)
                return
            }

            visiting.add(beanName)
            for (const depName of bean.dependencies) {
                if (depName === Scope.INTERNAL_SCOPE_DEPENDENCY) continue
                visit(depName, [...trail, beanName])
            }
            visiting.delete(beanName)
            visited.add(beanName)
            order.push(bean)
        }

        for (const bean of beans) {
            visit(bean.name, [])
        }

        return { resolved: order, missing: Array.from(missingDependencies) }
    }

    instantiateBeans(beans: Bean[]) {
        type ClassFactory = {
            new(...args: unknown[]): unknown
            getInstance?: (...args: unknown[]) => unknown
        }

        for (const bean of beans) {
            const dependencies = bean.dependencies.map(dependencyName => {
                if (dependencyName === Scope.INTERNAL_SCOPE_DEPENDENCY) {
                    return this
                }

                const initializedDependency = this.findInitializedDependency(dependencyName)
                if (initializedDependency === undefined) {
                    throw new Error(`Dependency was not initialized: ${dependencyName} for bean ${bean.name}`)
                }
                return initializedDependency.instance
            })

            const clazz = bean.clazz as unknown as ClassFactory
            const instance = typeof clazz.getInstance === "function"
                ? clazz.getInstance(...dependencies)
                : new clazz(...dependencies)

            this.beans.push(new InitializedBean(bean.name, instance))
        }
    }

    private displayTierGraph(beans: Bean[]) {
        const tierByName = new Map<string, number>()
        const tiers = new Map<number, string[]>()

        for (const bean of beans) {
            const maxDependencyTier = bean.dependencies.reduce((maxTier, dependencyName) => {
                if (dependencyName === Scope.INTERNAL_SCOPE_DEPENDENCY) {
                    return maxTier
                }

                const dependencyTier = tierByName.get(dependencyName)
                if (dependencyTier !== undefined) {
                    return Math.max(maxTier, dependencyTier)
                }

                const suppliedDependency = this.findInitializedDependency(dependencyName)
                if (suppliedDependency) {
                    return Math.max(maxTier, -1)
                }

                throw new Error(`Failed to compute tier: missing dependency tier for ${dependencyName}`)
            }, -1)

            const currentTier = maxDependencyTier + 1
            tierByName.set(bean.name, currentTier)

            const tierGroup = tiers.get(currentTier) ?? []
            tierGroup.push(bean.name)
            tiers.set(currentTier, tierGroup)
        }

        console.log("Bean Initialization Tiers:")
        const sortedTiers = Array.from(tiers.keys()).sort((a, b) => a - b)
        for (const tier of sortedTiers) {
            const beanNames = tiers.get(tier) ?? []
            console.log(`  Tier ${tier}: ${beanNames.join(", ")}`)
        }
    }

    private findInitializedDependency(name: string): InitializedBean | undefined {
        return this.beans.find(initializedBean => initializedBean.name == name)
            ?? this.parent?.supplyDependencies([name])[0]
    }

    public supplyDependencies(names: string[]): InitializedBean[] {
        const supplied = new Map<string, InitializedBean>()

        for (const name of names) {
            const local = this.beans.find(bean => bean.name === name)
            if (local) {
                supplied.set(name, local)
                continue
            }

            const fromParent = this.parent?.supplyDependencies([name])[0]
            if (fromParent) {
                supplied.set(name, fromParent)
            }
        }

        return Array.from(supplied.values())
    }

    public get<T>(clazz: abstract new (...args: unknown[]) => T): T[] {
        const beans = this.beans.filter(b => b.instance instanceof clazz || b.instance === clazz)
        if (beans.length === 0) {
            throw new Error(`No bean found for class: ${clazz.name}`)
        }
        return beans.map(b => b.instance as T)
    }

    public async getAsync<T>(clazz: abstract new (...args: unknown[]) => T): Promise<T[]> {
        await this.awaitComplete()
        return this.get(clazz)
    }

    public async awaitComplete(): Promise<void> {
        while (!this.complete) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }
    }

    public static async getScope(rootDir: string, parent?: Scope) {
        const scope = new Scope(rootDir, parent)

        while (!scope.complete) {
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        return scope
    }
}