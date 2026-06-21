import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { DigiEmptyState } from '../../design-system/components';

/** Generic placeholder page for routes whose feature is not yet implemented. */
@Component({
  selector: 'app-coming-soon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DigiEmptyState],
  template: `
    <digi-empty-state icon="⟡" [title]="title()" message="This feature is coming online soon." />
  `,
})
export class ComingSoon {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = toSignal(
    this.route.data.pipe(map((d) => (d['title'] as string) ?? 'Coming soon')),
    { initialValue: 'Coming soon' },
  );
}
