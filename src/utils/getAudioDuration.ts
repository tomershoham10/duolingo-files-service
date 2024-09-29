import * as mm from 'music-metadata';

export async function getAudioDuration(file: Express.Multer.File): Promise<number | null> {
    try {
        // Parse the metadata directly from the buffer
        const audioMetadata = await mm.parseBuffer(file.buffer, file.mimetype);

        // Get the duration in seconds
        const durationInSeconds = audioMetadata.format.duration;

        return durationInSeconds ? Math.round(durationInSeconds) : null;
    } catch (error) {
        throw new Error(`Error parsing audio metadata: ${error}`)
    }
}