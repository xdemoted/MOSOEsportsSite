import { DataRecord } from "./DataRecord";

export type PostOverlay = {

}

export class Overlay implements DataRecord {
    public rounds: number[][] = []

    constructor(
        public recordID: string,
        public createdBy: string,
        public createdAt: number,

        public overlaytype: string,
        public division: string,
        public match: string,
        public bestOf: string,

        public homeTeam: OverlayTeam,
        public awayTeam: OverlayTeam,

        public roundsPerSeries: string,
        public roundsToWin: string,
        public seriesPerMatch: string,
        public seriesToWin: string
    ) { }
}

export class OverlayTeam {
    constructor(
        public teamName: string,
        public teamColor: string,
        public teamURL: string,
        public teamDesc: string,
    ) { }
}