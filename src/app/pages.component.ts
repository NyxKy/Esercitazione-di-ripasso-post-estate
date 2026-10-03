import { Component, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import { CatalogComponent } from './catalog.component';
import { CATEGORIES, CategoryId } from './emoji.data';

@Component({
  selector: 'app-animals',
  imports: [CatalogComponent],
  template: '<app-catalog categoryId="animals" />',
})
export class AnimalsComponent {}

@Component({
  selector: 'app-fruits',
  imports: [CatalogComponent],
  template: '<app-catalog categoryId="fruits" />',
})
export class FruitsComponent {}

@Component({
  selector: 'app-generic',
  imports: [CatalogComponent, RouterLink],
  template: `
    @if (categoryId(); as id) {
      <app-catalog [categoryId]="id" [dynamic]="true" />
    } @else {
      <section class="page-width empty-state" id="catalogo">
        <h2>Questa categoria è ancora da scoprire.</h2>
        <p>Nel nostro archivio trovi animali, frutta, cibo e veicoli.</p>
        <a class="btn btn-dark" routerLink="/animals">Torna al catalogo</a>
      </section>
    }
  `,
})
export class GenericComponent {
  readonly categoryId = signal<CategoryId | null>(null);

  constructor(private readonly route: ActivatedRoute, destroyRef: DestroyRef) {
    // The component is reused between dynamic routes; unsubscribe when it is destroyed.
    this.route.paramMap.pipe(takeUntilDestroyed(destroyRef)).subscribe(this.getRouterParam);
  }

  readonly getRouterParam = (params: ParamMap): void => {
    const id = params.get('id');
    this.categoryId.set(CATEGORIES.find(category => category.id === id)?.id ?? null);
  };
}
