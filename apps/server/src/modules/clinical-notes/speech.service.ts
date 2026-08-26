import { Injectable } from '@nestjs/common';

@Injectable()
export class SpeechService {
  processAudioClip(fileName: string) {
    return { fileName, status: 'queued-for-processing' };
  }
}
