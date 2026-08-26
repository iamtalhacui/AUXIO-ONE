import { Injectable } from '@nestjs/common';

@Injectable()
export class SmartNotesService {
  draftNote(transcript: string) {
    return { transcript, status: 'draft-pending-review' };
  }
}
