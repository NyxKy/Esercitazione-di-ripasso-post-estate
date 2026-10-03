import { Component, DestroyRef, ElementRef, WritableSignal, afterEveryRender, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { tintFor } from './emoji.data';
import { CATEGORIES, CategoryId } from './emoji.data';
import { CollectionService } from './collection.service';

@Component({
  selector: 'app-catalog',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent {
  readonly categoryId = input.required<CategoryId>();
  readonly dynamic = input(false);
  /** Tinta di una categoria: dichiarata nei dati o derivata dall'id. */
  readonly tintFor = tintFor;
  readonly collection = inject(CollectionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chipsHost = viewChild<ElementRef<HTMLElement>>('chipsHost');
  private readonly dockHost = viewChild<ElementRef<HTMLElement>>('dockHost');
  private readonly switchHost = viewChild<ElementRef<HTMLElement>>('switchHost');
  readonly indicatorLeft = signal(0);
  readonly indicatorWidth = signal(0);
  readonly indicatorReady = signal(false);
  /** Posizione della pillola attiva della dock: si anima solo il transform. */
  readonly dockLeft = signal(0);
  readonly dockWidth = signal(0);
  /** Scostamento live della pillola mentre si trascina la dock. */
  readonly dockDrag = signal(0);
  readonly dockDragging = signal(false);
  /** Trascinamento dello switch Classico/Dinamico. */
  readonly switchDrag = signal(0);
  readonly switchDragging = signal(false);
  /** Trascinamento dei chip dei gruppi ("Tutti", ...). */
  readonly chipsDrag = signal(0);
  readonly chipsDragging = signal(false);
  /** Pressione prolungata senza trascinare: la pillola si solleva lo stesso. */
  readonly dockPressed = signal(false);
  readonly switchPressed = signal(false);
  readonly chipsPressed = signal(false);
  /** Vero per ~260 ms quando cambia il numero di emoji in vista. */
  readonly countPulsing = signal(false);
  /** Distanza fra due voci della dock: serve per lo scorrimento continuo. */
  readonly dockStride = signal(0);
  /** Voce su cui la pillola si aggancerebbe: aggiorna la tinta durante il drag. */
  readonly dockPreview = signal<number | null>(null);
  /** Vero per ~240 ms quando cambia la vista: fa entrare la griglia. */
  readonly gridEntering = signal(false);
  private dragActive = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private dragStartTime = 0;
  private dragIndex = -1;
  private justDragged = false;
  private switchActive = false;
  private switchStartX = 0;
  private switchStride = 0;
  private chipsActive = false;
  private chipsStartX = 0;
  private chipsIndex = 0;
  private chipsStops: { left: number; width: number; top: number }[] = [];
  private countReady = false;
  private pressTimer?: ReturnType<typeof setTimeout>;
  readonly categories = CATEGORIES;
  readonly query = signal('');
  readonly group = signal('Tutti');
  readonly sort = signal('default');
  readonly category = computed(() => CATEGORIES.find(category => category.id === this.categoryId())!);
  readonly source = computed(() => this.collection.favoritesOnly()
    ? CATEGORIES.flatMap(category => category.items).filter(item => this.collection.favorites().includes(item.id))
    : this.category().items);
  readonly groups = computed(() => ['Tutti', ...new Set(this.source().map(item => item.group))]);
  /** Categorie effettivamente mostrate nella dock (in classico solo animali e frutta). */
  private readonly dockCategories = computed(() => this.dynamic() ? CATEGORIES : CATEGORIES.filter(category => category.classic));
  /** Categoria evidenziata nella dock: durante il trascinamento e quella agganciata. */
  readonly dockActiveId = computed<CategoryId | null>(() => {
    const preview = this.dockPreview();
    if (preview !== null) return this.dockCategories()[preview]?.id ?? null;
    return this.collection.favoritesOnly() ? null : this.categoryId();
  });
  readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('it');
    const result = this.source().filter(item =>
      (this.group() === 'Tutti' || item.group === this.group()) &&
      (item.name.toLocaleLowerCase('it').includes(query) || item.emoji.includes(query) ||
        item.group.toLocaleLowerCase('it').includes(query)),
    );
    return this.sort() === 'name'
      ? [...result].sort((a, b) => a.name.localeCompare(b.name, 'it'))
      : result;
  });

  constructor() {
    effect((onCleanup) => {
      this.categoryId();
      this.collection.favoritesOnly();
      this.resetFilters();
      // Entra solo al cambio di vista: la ricerca e i filtri non animano nulla.
      this.gridEntering.set(true);
      const timer = setTimeout(() => this.gridEntering.set(false), 240);
      onCleanup(() => clearTimeout(timer));
    });
    // Il badge del conteggio pulsa quando cambia la vista o il gruppo scelto:
    // non sulla ricerca, altrimenti pulserebbe a ogni lettera digitata.
    effect((onCleanup) => {
      this.source().length;
      this.group();
      if (!this.countReady) {
        this.countReady = true;
        return;
      }
      this.countPulsing.set(true);
      const timer = setTimeout(() => this.countPulsing.set(false), 260);
      onCleanup(() => clearTimeout(timer));
    });
    // La pillola dei chip scorre sul bottone selezionato a ogni render.
    afterEveryRender(() => this.updateIndicator());
    // Dopo un trascinamento il click che segue non deve navigare: lo si assorbe
    // in fase di capture, prima che routerLink lo veda.
    const swallowClick = (event: MouseEvent): void => {
      if (!this.justDragged) return;
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener('click', swallowClick, { capture: true });
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('click', swallowClick, { capture: true });
      this.stopDockListeners();
      this.stopSwitchListeners();
      this.stopChipsListeners();
      clearTimeout(this.pressTimer);
    });
  }

  /* =========================================================================
     GESTI E ANIMAZIONI: trascinamento di dock, switch e chip dei gruppi
     ========================================================================= */
  /** Ascolta il gesto su tutto il documento: piu affidabile della cattura. */
  private listenDrag(move: (event: Event) => void, up: (event: Event) => void): void {
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', up);
    document.addEventListener('touchcancel', up);
  }

  private unlistenDrag(move: (event: Event) => void, up: (event: Event) => void): void {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    document.removeEventListener('touchmove', move);
    document.removeEventListener('touchend', up);
    document.removeEventListener('touchcancel', up);
  }

  /**
   * Trascinamento della dock. Un solo percorso di codice per pointer, mouse e
   * touch: i listener stanno sul documento, gli handler lavorano solo su una
   * coordinata X e sono idempotenti, quindi piu famiglie di eventi possono
   * convivere senza doppioni (il primo "up" chiude e rimuove tutto).
   */
  startDockDrag(event: Event): void {
    if (this.dragActive) return;
    const point = this.pointFrom(event);
    if (!point || point.button !== 0) return;
    this.dragActive = true;
    this.dragStartX = point.x;
    this.dragStartY = point.y;
    this.dragStartTime = performance.now();
    this.dragIndex = this.dockCategories().findIndex(category => category.id === this.categoryId());
    this.dockDrag.set(0);
    this.dockPreview.set(null);
    this.armPress(this.dockPressed);
    this.listenDrag(this.onDockMove, this.onDockUp);
  }

  private pointFrom(event: Event): { x: number; y: number; button: number } | null {
    if (event instanceof MouseEvent) return { x: event.clientX, y: event.clientY, button: event.button };
    const touch = (event as TouchEvent).touches?.[0] ?? (event as TouchEvent).changedTouches?.[0];
    return touch ? { x: touch.clientX, y: touch.clientY, button: 0 } : null;
  }

  readonly onDockMove = (event: Event): void => {
    if (!this.dragActive) return;
    const point = this.pointFrom(event);
    if (!point) return;
    const distance = point.x - this.dragStartX;
    // Durante il gesto orizzontale il browser non deve scorrere la pagina;
    // un movimento verticale resta invece libero di scorrere.
    if (event.type === 'touchmove' && event.cancelable && Math.abs(distance) > Math.abs(point.y - this.dragStartY)) {
      event.preventDefault();
    }
    if (!this.dockDragging()) {
      if (Math.abs(distance) <= 4) return;
      this.dockDragging.set(true);
    }
    // Le voci restano ferme: e la pillola a seguire il gesto, come il pollice di
    // un cursore. Aggancio alla voce piu vicina, anche a due o tre passi.
    const stride = this.dockStride() || 1;
    const last = this.dockCategories().length - 1;
    const min = -this.dragIndex * stride;
    const max = (last - this.dragIndex) * stride;
    const clamped = Math.max(min, Math.min(max, distance));
    // La pillola non esce mai dalla dock: agli estremi si ferma e basta.
    this.dockDrag.set(clamped);
    this.dockPreview.set(Math.max(0, Math.min(last, this.dragIndex + Math.round(clamped / stride))));
  };

  readonly onDockUp = (event: Event): void => {
    this.stopDockListeners();
    this.releasePress(this.dockPressed);
    if (!this.dragActive) return;
    const point = this.pointFrom(event);
    const distance = point ? point.x - this.dragStartX : 0;
    const elapsed = Math.max(1, performance.now() - this.dragStartTime);
    const velocity = Math.abs(distance) / elapsed;
    const index = this.dragIndex;
    const dragged = this.dockDragging();
    const last = this.dockCategories().length - 1;
    const stride = this.dockStride() || 1;
    let target = this.dockPreview();
    this.dragActive = false;
    this.dockDragging.set(false);
    if (!dragged || Math.abs(distance) <= 6) {
      this.dockDrag.set(0);
      this.dockPreview.set(null);
      return;
    }
    // Una flick corta e veloce vale come un passo, se l'aggancio non si e mosso.
    if ((target === null || target === index) && velocity > 0.5) {
      target = Math.max(0, Math.min(last, index + (distance > 0 ? 1 : -1)));
    }
    this.justDragged = true;
    setTimeout(() => { this.justDragged = false; }, 400);
    if (target === null || target === index || index < 0) {
      this.dockDrag.set(0);
      this.dockPreview.set(null);
      return;
    }
    // La pillola resta dove l'hai lasciata: la misura successiva azzera lo
    // scostamento quando la categoria scelta e attiva, senza salti.
    this.dockDrag.set((target - index) * stride);
    this.collection.favoritesOnly.set(false);
    void this.router.navigate(this.categoryRoute(this.dockCategories()[target].id));
    this.scrollToCatalog();
  };

  private stopDockListeners(): void {
    this.unlistenDrag(this.onDockMove, this.onDockUp);
  }

  /**
   * Trascinamento dello switch Classico/Dinamico: stessa meccanica della dock,
   * ma con due sole voci. La pillola segue il gesto e si cambia modo al rilascio.
   */
  startSwitchDrag(event: Event): void {
    if (this.switchActive) return;
    const point = this.pointFrom(event);
    const host = this.switchHost();
    if (!point || point.button !== 0 || !host) return;
    this.switchActive = true;
    this.switchStartX = point.x;
    this.switchStride = (host.nativeElement.offsetWidth - 6) / 2;
    this.switchDrag.set(0);
    this.armPress(this.switchPressed);
    this.listenDrag(this.onSwitchMove, this.onSwitchUp);
  }

  readonly onSwitchMove = (event: Event): void => {
    if (!this.switchActive) return;
    const point = this.pointFrom(event);
    if (!point) return;
    const distance = point.x - this.switchStartX;
    if (event.type === 'touchmove' && event.cancelable && Math.abs(distance) > 4) event.preventDefault();
    if (!this.switchDragging()) {
      if (Math.abs(distance) <= 4) return;
      this.switchDragging.set(true);
    }
    // La pillola non esce dallo switch: da dinamico si va solo a sinistra e viceversa.
    const stride = this.switchStride || 1;
    const min = this.dynamic() ? -stride : 0;
    const max = this.dynamic() ? 0 : stride;
    this.switchDrag.set(Math.max(min, Math.min(max, distance)));
  };

  readonly onSwitchUp = (event: Event): void => {
    this.stopSwitchListeners();
    this.releasePress(this.switchPressed);
    if (!this.switchActive) return;
    const point = this.pointFrom(event);
    const distance = point ? point.x - this.switchStartX : 0;
    const dragged = this.switchDragging();
    this.switchActive = false;
    this.switchDragging.set(false);
    this.switchDrag.set(0);
    const stride = this.switchStride || 1;
    if (!dragged || Math.abs(distance) <= stride * 0.5) return;
    this.justDragged = true;
    setTimeout(() => { this.justDragged = false; }, 400);
    const toDynamic = distance > 0;
    if (toDynamic === this.dynamic()) return;
    this.collection.favoritesOnly.set(false);
    const id = this.categoryId();
    void this.router.navigate(toDynamic ? ['/generic', id] : ['/', id === 'fruits' ? 'fruits' : 'animals']);
    this.scrollToCatalog();
  };

  private stopSwitchListeners(): void {
    this.unlistenDrag(this.onSwitchMove, this.onSwitchUp);
  }

  /**
   * Trascinamento dei chip dei gruppi ("Tutti", ...): la pillola segue il gesto e
   * al rilascio si aggancia al chip piu vicino. I chip hanno larghezze diverse,
   * quindi si misurano le posizioni reali invece di contare i passi.
   */
  startChipsDrag(event: Event): void {
    if (this.chipsActive) return;
    const point = this.pointFrom(event);
    const host = this.chipsHost();
    if (!point || point.button !== 0 || !host) return;
    const buttons = [...host.nativeElement.querySelectorAll('button')];
    const stops = buttons.map(button => ({ left: button.offsetLeft, width: button.offsetWidth, top: button.offsetTop }));
    const index = buttons.findIndex(button => button.classList.contains('selected'));
    // Se i chip vanno a capo, il gesto orizzontale non ha un ordine chiaro.
    if (index < 0 || stops.some(stop => stop.top !== stops[0].top)) return;
    this.chipsActive = true;
    this.chipsStartX = point.x;
    this.chipsIndex = index;
    this.chipsStops = stops;
    this.chipsDrag.set(0);
    this.armPress(this.chipsPressed);
    this.listenDrag(this.onChipsMove, this.onChipsUp);
  }

  readonly onChipsMove = (event: Event): void => {
    if (!this.chipsActive) return;
    const point = this.pointFrom(event);
    if (!point) return;
    const distance = point.x - this.chipsStartX;
    if (event.type === 'touchmove' && event.cancelable && Math.abs(distance) > 4) event.preventDefault();
    if (!this.chipsDragging()) {
      if (Math.abs(distance) <= 4) return;
      this.chipsDragging.set(true);
    }
    const stops = this.chipsStops;
    const current = stops[this.chipsIndex];
    const last = stops[stops.length - 1];
    const min = -current.left;
    const max = last.left + last.width - (current.left + current.width);
    const clamped = Math.max(min, Math.min(max, distance));
    // Come la dock: la pillola non esce dalla riga dei chip.
    this.chipsDrag.set(clamped);
  };

  readonly onChipsUp = (event: Event): void => {
    this.stopChipsListeners();
    this.releasePress(this.chipsPressed);
    if (!this.chipsActive) return;
    const point = this.pointFrom(event);
    const distance = point ? point.x - this.chipsStartX : 0;
    const dragged = this.chipsDragging();
    this.chipsActive = false;
    this.chipsDragging.set(false);
    this.chipsDrag.set(0);
    if (!dragged) return;
    this.justDragged = true;
    setTimeout(() => { this.justDragged = false; }, 400);
    // Si aggancia il chip il cui centro e piu vicino a quello della pillola.
    const stops = this.chipsStops;
    const current = stops[this.chipsIndex];
    const center = current.left + distance + current.width / 2;
    let best = this.chipsIndex;
    let bestGap = Infinity;
    stops.forEach((stop, index) => {
      const gap = Math.abs(stop.left + stop.width / 2 - center);
      if (gap < bestGap) { bestGap = gap; best = index; }
    });
    const buttons = [...(this.chipsHost()?.nativeElement.querySelectorAll('button') ?? [])];
    const label = buttons[best]?.textContent?.trim();
    if (label) this.group.set(label);
  };

  private stopChipsListeners(): void {
    this.unlistenDrag(this.onChipsMove, this.onChipsUp);
  }

  /**
   * Dopo 180 ms di pressione la pillola si solleva anche senza trascinare: un
   * click rapido non fa in tempo, cosi non lampeggia a ogni navigazione.
   */
  private armPress(state: WritableSignal<boolean>): void {
    clearTimeout(this.pressTimer);
    this.pressTimer = setTimeout(() => state.set(true), 180);
  }

  private releasePress(state: WritableSignal<boolean>): void {
    clearTimeout(this.pressTimer);
    state.set(false);
  }

  browseCategory(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    this.collection.favoritesOnly.set(false);
    this.scrollToCatalog();
  }

  private scrollToCatalog(): void {
    document.getElementById('catalogo')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }

  private updateIndicator(): void {
    const host = this.chipsHost();
    if (host) {
      const selected = host.nativeElement.querySelector<HTMLElement>('.filter-chips .selected');
      if (selected) {
        this.indicatorLeft.set(selected.offsetLeft);
        this.indicatorWidth.set(selected.offsetWidth);
      }
    }
    // Dock: la pillola attiva scorre verso la categoria corrente. Le colonne
    // sono di pari larghezza, quindi la posizione si anima con transform.
    // L'indice arriva dal modello: la classe active-menu e scritta anche da
    // routerLinkActive e puo essere in ritardo di un ciclo.
    const dock = this.dockHost();
    if (dock) {
      const visible = Array.from(dock.nativeElement.querySelectorAll<HTMLElement>('a'))
        .filter(link => !link.classList.contains('dock-hidden'));
      const index = this.collection.favoritesOnly()
        ? -1
        : this.dockCategories().findIndex(category => category.id === this.categoryId());
      const active = visible[index] ?? null;
      this.dockWidth.set(active ? active.offsetWidth : 0);
      this.dockLeft.set(active ? active.offsetLeft : 0);
      this.dockStride.set(visible.length > 1 ? visible[1].offsetLeft - visible[0].offsetLeft : 0);
      // Lo scostamento del trascinamento si azzera solo quando la categoria
      // scelta e attiva: cosi la pillola non torna indietro prima di spostarsi.
      const preview = this.dockPreview();
      const landed = preview !== null && this.dockCategories()[preview]?.id === this.categoryId();
      if (!this.dragActive && (preview === null || landed)) {
        this.dockDrag.set(0);
        this.dockPreview.set(null);
      }
    }
    // Arma la transizione un turno dopo: la prima misura non deve scivolare.
    if (!this.indicatorReady()) setTimeout(() => this.indicatorReady.set(true));
  }

  categoryRoute(id: CategoryId): string[] {
    return this.dynamic() || id === 'food' || id === 'vehicles' ? ['/generic', id] : ['/', id];
  }

  resetFilters(): void {
    this.query.set('');
    this.group.set('Tutti');
    this.sort.set('default');
  }
}
