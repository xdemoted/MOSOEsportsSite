type SingletonStatics<T> = {
  instance?: T
  getInstance(): T
}

function copyReflectMetadata(source: unknown, target: unknown) {
  const reflect = Reflect as any
  if (typeof reflect.getMetadataKeys !== "function" || typeof reflect.getMetadata !== "function" || typeof reflect.defineMetadata !== "function") {
    return
  }

  for (const metadataKey of reflect.getMetadataKeys(source)) {
    const metadataValue = reflect.getMetadata(metadataKey, source)
    reflect.defineMetadata(metadataKey, metadataValue, target)
  }

  const sourcePrototype = (source as any)?.prototype
  const targetPrototype = (target as any)?.prototype
  if (!sourcePrototype || !targetPrototype) {
    return
  }

  for (const metadataKey of reflect.getMetadataKeys(sourcePrototype)) {
    const metadataValue = reflect.getMetadata(metadataKey, sourcePrototype)
    reflect.defineMetadata(metadataKey, metadataValue, targetPrototype)
  }
}

export function Singleton<T extends new (...args: any[]) => any>(ctor: T) {
  type Instance = InstanceType<T>

  class Wrapped extends ctor {
    static instance: Instance
    static singleton = true

    static getInstance(...args: any[]): Instance {
      if (!this.instance) {
        this.instance = new this(...args)
      }
      return this.instance
    }
  }

  Object.defineProperty(Wrapped, 'name', { value: ctor.name })
  copyReflectMetadata(ctor, Wrapped)

  return Wrapped as unknown as T & SingletonStatics<Instance>
}