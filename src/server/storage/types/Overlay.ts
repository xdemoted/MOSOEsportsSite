import { DataRecord } from "./DataRecord";

export type PostOverlay = {

}

export class Overlay implements DataRecord {
    constructor(
        public recordID: string,
        public createdBy: string,
        public createdAt: string,

        public overlaytype: string,
        public t1: string,
        public t1c: string,
        public t1u: string,
        public t2: string,
        public t2c: string,
        public t2u: string,
        public rps: string,
        public rtw: string,
        public spm: string,
        public stw: string
    ) {}
}