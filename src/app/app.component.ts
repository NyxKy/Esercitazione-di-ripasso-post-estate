import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CollectionService } from './collection.service';
import { CATEGORIES, Emoji } from './emoji.data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class App {
  readonly collection = inject(CollectionService);
  private readonly router = inject(Router);
  readonly mobileOpen = signal(false);
  readonly randomEmoji = signal<Emoji | null>(null);
  readonly total = CATEGORIES.reduce((total, category) => total + category.items.length, 0);
  @ViewChild('randomDialog') private randomDialog?: ElementRef<HTMLDialogElement>;

  async openCollection(): Promise<void> {
    await this.router.navigate(['/animals']);
    this.collection.favoritesOnly.set(true);
    this.mobileOpen.set(false);
    this.scrollToCatalog();
  }

  scrollToCatalog(): void {
    document.getElementById('catalogo')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }

  surprise(): void {
    const items = CATEGORIES.flatMap(category => category.items);
    const candidates = items.filter(item => item.id !== this.randomEmoji()?.id);
    this.randomEmoji.set(candidates[Math.floor(Math.random() * candidates.length)]);
    if (!this.randomDialog?.nativeElement.open) this.randomDialog?.nativeElement.showModal();
  }

  closeRandom(): void {
    this.randomDialog?.nativeElement.close();
  }
}
