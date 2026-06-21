import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNav } from './layout/mobile-nav/bottom-nav';
import { Sidebar } from './layout/desktop-sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, BottomNav, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly brand = signal('DigiVerse Arena');
}
