import { Singleton } from "src/container/Singleton";
import { User } from "../types/User";
import { StorageHandler } from "../StorageHandler";
import { AbstractStorageHandler } from "./AbstractStorageHandler";
import { Overlay } from "../types/Overlay";

@Singleton
export class OverlayStorageHandler extends AbstractStorageHandler<Overlay> {
    constructor (storageHandler: StorageHandler) {
        super(storageHandler)
    }

    public override getTable(): string {
        return "overlays"
    }

    public getOverlay(overlayID: string) {
        return this.getValue(overlayID)
    }

    public removeOverlay(overlayID: string) {
        return this.removeValue(overlayID)
    }

    public updateOverlay(overlay: Overlay) {
        return this.updateValue(overlay)
    }
}