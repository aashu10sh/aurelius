import type { JournalEntry, Reflection } from '../../../domain/models/journal'
import type { IJournalRepository } from '../../../domain/repositories/IJournalRepository'
import type { IReflectionRepository } from '../../../domain/repositories/IReflectionRepository'

export class ListJournalUseCase {
  constructor(
    private readonly journal: IJournalRepository,
    private readonly reflections: IReflectionRepository,
  ) {}

  async execute(userId: string, limit = 30): Promise<{ entries: JournalEntry[]; reflections: Reflection[] }> {
    const [entries, reflections] = await Promise.all([
      this.journal.list(userId, limit),
      this.reflections.list(userId, limit),
    ])
    return { entries, reflections }
  }
}
