import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
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
  readonly collection = inject(CollectionService);
  readonly categories = CATEGORIES;
  readonly query = signal('');
  readonly group = signal('Tutti');
  readonly sort = signal('default');
  readonly category = computed(() => CATEGORIES.find(category => category.id === this.categoryId())!);
  readonly source = computed(() => this.collection.favoritesOnly()
    ? CATEGORIES.flatMap(category => category.items).filter(item => this.collection.favorites().includes(item.id))
    : this.category().items);
  readonly groups = computed(() => ['Tutti', ...new Set(this.source().map(item => item.group))]);
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
    effect(() => {
      this.categoryId();
      this.collection.favoritesOnly();
      this.resetFilters();
    });
  }

  categoryRoute(id: CategoryId): string[] {
    return this.dynamic() || id === 'food' || id === 'vehicles' ? ['/generic', id] : ['/', id];
  }

  browseCategory(event: MouseEvent): void {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    this.collection.favoritesOnly.set(false);
    document.getElementById('catalogo')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    });
  }

  resetFilters(): void {
    this.query.set('');
    this.group.set('Tutti');
    this.sort.set('default');
  }
}
