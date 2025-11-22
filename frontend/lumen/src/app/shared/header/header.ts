import { Component, HostListener } from '@angular/core';
import {CommonModule, NgClass} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [
    NgClass,
    RouterLink,
    RouterLinkActive,
    CommonModule,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  isLoggedIn = false;
  isDark = false;
  showProfileMenu = false;
  menuOpen = false;
  isScrolled = false;

  lightLogo = 'assets/images/logo-lightmode.svg';
  darkLogo = 'assets/images/logo-darkmode.svg';

  get logo() {
    return this.isDark ? this.darkLogo : this.lightLogo;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  toggleTheme() {
    this.isDark = !this.isDark;
    document.body.classList.toggle('dark-theme', this.isDark);
  }

  logout() {
    this.isLoggedIn = false;
    this.showProfileMenu = false;
    // later: integrate with real auth
  }
  
  @HostListener('window:scroll')
  onScroll() {
    const threshold = 10;
    this.isScrolled = window.scrollY > threshold;
  }
}
