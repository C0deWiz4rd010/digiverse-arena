import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BottomNav } from './layout/mobile-nav/bottom-nav';
import { Sidebar } from './layout/desktop-sidebar/sidebar';
import { PlayerService } from './core/player/player.service';
import { TamerAvatar } from './design-system/components/tamer-avatar';
import { ToastHost } from './design-system/components/toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, BottomNav, Sidebar, TamerAvatar, ToastHost],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly player = inject(PlayerService);
  private readonly router = inject(Router);

  protected readonly brand = signal('DigiVerse Arena');
  protected readonly profile = this.player.profile;
  protected readonly rank = this.player.rank;
  protected readonly bits = this.player.bits;
  protected readonly onboarded = this.player.onboarded;
  protected readonly bitsLabel = computed(() => {
    const value = this.bits();
    return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`;
  });

  ngOnInit(): void {
    // First run: guide new tamers through onboarding (skippable).
    if (this.player.loaded() && !this.player.onboarded() && !this.router.url.startsWith('/welcome')) {
      void this.router.navigate(['/welcome']);
    }
  }
}
