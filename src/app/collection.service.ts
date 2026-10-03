import { Injectable, signal } from '@angular/core';
import { CATEGORIES, Emoji } from './emoji.data';

@Injectable({ providedIn: 'root' })
export class CollectionService {
  readonly favorites = signal<string[]>(this.readFavorites());
  readonly favoritesOnly = signal(false);
  readonly notice = signal('');
  /** Id dell'emoji appena salvata: pilota il "pop" del cuore per ~240 ms. */
  readonly pulsing = signal<string | null>(null);
  private noticeTimer?: ReturnType<typeof setTimeout>;
  private pulseTimer?: ReturnType<typeof setTimeout>;

  toggleFavorite(item: Emoji): void {
    const exists = this.favorites().includes(item.id);
    this.favorites.update(ids => exists ? ids.filter(id => id !== item.id) : [...ids, item.id]);
    try {
      localStorage.setItem('emojicorp-favorites', JSON.stringify(this.favorites()));
    } catch {
      this.notify('Raccolta aggiornata. Il browser non consente il salvataggio permanente.');
    }
    // Pulsa solo quando l'emoji viene salvata, non quando viene rimossa.
    if (exists) return;
    clearTimeout(this.pulseTimer);
    this.pulsing.set(item.id);
    this.pulseTimer = setTimeout(() => this.pulsing.set(null), 240);
  }

  async copy(item: Emoji): Promise<void> {
    try {
      await navigator.clipboard.writeText(item.emoji);
      this.notify(`${item.emoji} ${item.name}: emoji copiata!`);
    } catch {
      this.notify(`Copia non disponibile. Seleziona e copia questa emoji: ${item.emoji}`);
    }
  }

  notify(message: string): void {
    clearTimeout(this.noticeTimer);
    this.notice.set(message);
    this.noticeTimer = setTimeout(() => this.notice.set(''), 4000);
  }

  private readFavorites(): string[] {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('emojicorp-favorites') ?? '[]');
      const validIds = new Set(CATEGORIES.flatMap(category => category.items.map(item => item.id)));
      return Array.isArray(stored)
        ? [...new Set(stored.filter((id): id is string => typeof id === 'string' && validIds.has(id)))]
        : [];
    } catch {
      return [];
    }
  }
}
