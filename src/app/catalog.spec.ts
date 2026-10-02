import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { vi } from 'vitest';
import { routes } from './app-routes';
import { CatalogComponent } from './catalog.component';
import { CollectionService } from './collection.service';
import { CATEGORIES } from './emoji.data';
import { GenericComponent } from './pages.component';

describe('Catalogo EmojiCorp', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('contiene 48 emoji con identificatori univoci', () => {
    const items = CATEGORIES.flatMap(category => category.items);
    expect(items.length).toBe(48);
    expect(new Set(items.map(item => item.id)).size).toBe(48);
  });

  it('reindirizza la pagina iniziale agli animali', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('.category-heading h3')?.textContent).toBe('Animali');
    expect(harness.routeNativeElement?.querySelectorAll('.emoji-card').length).toBe(12);
  });

  it('aggiorna i dati quando cambia il parametro sullo stesso componente', async () => {
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/generic/fruits', GenericComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Limone');
    const second = await harness.navigateByUrl('/generic/vehicles', GenericComponent);
    expect(second).toBe(first);
    expect(harness.routeNativeElement?.textContent).toContain('Automobile');
    expect(harness.routeNativeElement?.textContent).not.toContain('Limone');
  });

  it('mostra un messaggio per le categorie non valide', async () => {
    const harness = await RouterTestingHarness.create('/generic/unknown');
    expect(harness.routeNativeElement?.textContent).toContain('Questa categoria');
  });

  it('cerca senza distinzione di maiuscole, filtra e ordina', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.componentRef.setInput('categoryId', 'animals');
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.query.set(' GATTO ');
    expect(component.filtered().map(item => item.id)).toEqual(['cat']);
    component.query.set('');
    component.group.set('Marini');
    expect(component.filtered().length).toBe(2);
    component.group.set('Tutti');
    component.sort.set('name');
    expect(component.filtered()[0].name).toBe('Balena');
    component.query.set('inesistente');
    expect(component.filtered()).toEqual([]);
  });

  it('salva i preferiti e li raccoglie da tutte le categorie', async () => {
    const service = TestBed.inject(CollectionService);
    service.toggleFavorite(CATEGORIES[1].items[0]);
    expect(JSON.parse(localStorage.getItem('emojicorp-favorites')!)).toEqual(['lemon']);
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.componentRef.setInput('categoryId', 'animals');
    await fixture.whenStable();
    service.favoritesOnly.set(true);
    expect(fixture.componentInstance.filtered().map(item => item.id)).toEqual(['lemon']);
    service.toggleFavorite(CATEGORIES[1].items[0]);
    expect(service.favorites()).toEqual([]);
  });

  it('ignora salvataggi corrotti o identificatori sconosciuti', () => {
    localStorage.setItem('emojicorp-favorites', 'invalid-json');
    expect(new CollectionService().favorites()).toEqual([]);
    localStorage.setItem('emojicorp-favorites', '["dog","dog",42,"missing"]');
    expect(new CollectionService().favorites()).toEqual(['dog']);
  });

  it('copia il simbolo e comunica il risultato', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const service = TestBed.inject(CollectionService);
    try {
      await service.copy(CATEGORIES[0].items[0]);
      expect(writeText).toHaveBeenCalledWith(CATEGORIES[0].items[0].emoji);
      expect(service.notice()).toContain('emoji copiata');
      writeText.mockRejectedValue(new Error('denied'));
      await service.copy(CATEGORIES[0].items[0]);
      expect(service.notice()).toContain('Copia non disponibile');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
