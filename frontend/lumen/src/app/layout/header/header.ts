import { Component, HostListener } from '@angular/core';
import {CommonModule, NgClass} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    NgClass,
    RouterLink,
    RouterLinkActive,
    CommonModule,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss',],
})
export class Header {
  isLoggedIn = false;
  isDark = false;
  showProfileMenu = false;
  menuOpen = false;
  isScrolled = false;
  isClosingProfile = false;

  lightLogo = 'assets/images/logo-lightmode.svg';
  darkLogo = 'assets/images/logo-darkmode.svg';

  get logo() {
    return this.isDark ? this.darkLogo : this.lightLogo;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  /** 
   * Clean helper function — runs fade-out animation, then removes from DOM
   */
  private closeProfileMenuWithAnimation() {
    if (!this.showProfileMenu) return; // already closed

    this.isClosingProfile = true;

    setTimeout(() => {
      this.showProfileMenu = false;
      this.isClosingProfile = false;
    }, 200); // must match dropdown-exit duration
  }

  toggleProfileMenu() {
    if (this.showProfileMenu) {
      this.closeProfileMenuWithAnimation();
    } else {
      this.showProfileMenu = true;
    }
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
  }

  logout() {
    this.isLoggedIn = false;
    this.closeProfileMenuWithAnimation();
  }

  @HostListener('window:scroll')
  onScroll() {
    const threshold = 10;
    this.isScrolled = window.scrollY > threshold;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInsideProfile = target.closest('.profile-wrapper');

    if (!clickedInsideProfile) {
      this.closeProfileMenuWithAnimation();
    }
  }
}
