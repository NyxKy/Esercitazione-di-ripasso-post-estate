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

  /** Voce "Esplora": va al catalogo e, se ci sei gia, ci scorre sopra. */
  goCatalog(): void {
    this.collection.favoritesOnly.set(false);
    this.mobileOpen.set(false);
    setTimeout(() => this.scrollToSection('#catalogo'), 60);
  }

  /** Voce "Il nostro universo": scorre alla sezione invece del salto secco. */
  goUniverse(event: Event): void {
    event.preventDefault();
    this.mobileOpen.set(false);
    this.scrollToSection('#universo');
  }

  private scrollToSection(selector: string): void {
    const target = document.querySelector(selector);
    if (!target) return;
    const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: ridotto ? 'auto' : 'smooth', block: 'start' });
  }

  /** Logo: torna alla home del catalogo e riporta in cima la pagina. */
  goHome(): void {
    this.collection.favoritesOnly.set(false);
    const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: ridotto ? 'auto' : 'smooth' });
  }

  scrollToCatalog(): void {
    document.getElementById('catalogo')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }

  /* =========================================================================
     ANIMAZIONI DEL DIALOG: uscita dal bottone e scambio emoji
     ========================================================================= */
  /** Scostamento in px dal centro del dialog al centro del bottone: cosi il
      pannello esce dal bottone sia che stia sopra sia che stia sotto. */
  readonly dialogOrigin = signal({ x: 0, y: 14 });
  /** Fase dell'emoji grande: 'out' esce a sinistra, 'in' entra da destra. */
  readonly artPhase = signal<'idle' | 'out' | 'in'>('idle');

  surprise(event?: Event): void {
    const items = CATEGORIES.flatMap(category => category.items);
    const candidates = items.filter(item => item.id !== this.randomEmoji()?.id);
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    const already = this.randomDialog?.nativeElement.open ?? false;
    if (already) {
      // Cambio emoji: la vecchia scivola a sinistra rimpicciolendosi, poi la
      // nuova entra da destra ingrandendosi. Tutto dentro il pannello.
      this.artPhase.set('out');
      setTimeout(() => {
        this.randomEmoji.set(next);
        this.artPhase.set('in');
        setTimeout(() => this.artPhase.set('idle'), 320);
      }, 200);
    } else {
      this.randomEmoji.set(next);
      this.artPhase.set('in');
      setTimeout(() => this.artPhase.set('idle'), 320);
    }
    if (!already) this.randomDialog?.nativeElement.showModal();
    // Il dialog cresce dal bottone che l'ha aperto. Si usano le misure di
    // layout (offsetWidth) e non getBoundingClientRect: la scatola e gia
    // scalata a 0.24 dall'animazione d'ingresso, quindi il rect inganna.
    const dialog = this.randomDialog?.nativeElement;
    const trigger = event?.currentTarget as HTMLElement | null;
    if (!dialog || !trigger) return;
    const width = dialog.offsetWidth;
    const height = dialog.offsetHeight;
    if (!width || !height) return;
    const box = trigger.getBoundingClientRect();
    // Un <dialog> modale e centrato dal foglio di stile del browser.
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    this.dialogOrigin.set({
      x: Math.round(box.left + box.width / 2 - (left + width / 2)),
      y: Math.round(box.top + box.height / 2 - (top + height / 2)),
    });
  }

  closeRandom(): void {
    this.randomDialog?.nativeElement.close();
  }
}
