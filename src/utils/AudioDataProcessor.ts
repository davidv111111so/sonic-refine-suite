export class AudioDataProcessor {
    private analyser: AnalyserNode;
    private dataArray: Uint8Array<ArrayBuffer>;
    private bufferLength: number;
    private smoothingFactor: number;
    private previousVolume: number = 0;

    constructor(analyser: AnalyserNode, smoothingFactor: number = 0.8) {
        this.analyser = analyser;
        this.bufferLength = analyser.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength) as Uint8Array<ArrayBuffer>;
        this.smoothingFactor = smoothingFactor;
    }

    getFrequencyData(): Uint8Array<ArrayBuffer> {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }

    getAverageVolume(): number {
        const data = this.getFrequencyData();
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        const average = sum / data.length;

        // Smooth the volume change
        this.previousVolume = this.previousVolume * this.smoothingFactor + average * (1 - this.smoothingFactor);
        return this.previousVolume;
    }

    getBassEnergy(): number {
        const data = this.getFrequencyData();
        // Bass is roughly the first 10% of the frequency data
        const bassRange = Math.floor(data.length * 0.1);
        let sum = 0;
        for (let i = 0; i < bassRange; i++) {
            sum += data[i];
        }
        return sum / bassRange;
    }

    getMidEnergy(): number {
        const data = this.getFrequencyData();
        const start = Math.floor(data.length * 0.1);
        const end = Math.floor(data.length * 0.5);
        let sum = 0;
        for (let i = start; i < end; i++) {
            sum += data[i];
        }
        return sum / (end - start);
    }

    getHighEnergy(): number {
        const data = this.getFrequencyData();
        const start = Math.floor(data.length * 0.5);
        let sum = 0;
        for (let i = start; i < data.length; i++) {
            sum += data[i];
        }
        return sum / (data.length - start);
    }
}
