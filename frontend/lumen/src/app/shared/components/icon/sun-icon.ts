import { Component } from '@angular/core';

@Component({
  selector: 'icon-sun',
  standalone: true,
  template: `
    <svg class="icon-svg" viewBox="0 0 24 24" width="18" height="24">
              <path fill="currentColor"
                d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm-10 6h2a1 1 0 000-2H2a1 1 0 000 2zm18 0h2a1 1 0 000-2h-2a1 1 0 000 2zM11 2v2a1 1 0 002 0V2a1 1 0 10-2 0zm0 18v2a1 1 0 002 0v-2a1 1 0 10-2 0zm-5.01-15.42a1 1 0 00-1.41 1.41l1.06 1.06a1 1 0 001.41-1.41L5.99 4.58zm12.37 12.37a1 1 0 00-1.41 1.41l1.06 1.06a1 1 0 001.41-1.41l-1.06-1.06zM19.42 5.99a1 1 0 000-1.41 1 1 0 00-1.41 0l-1.06 1.06a1 1 0 001.41 1.41l1.06-1.06zM7.05 18.36a1 1 0 10-1.41 1.41l1.06 1.06a1 1 0 001.41-1.41l-1.06-1.06z" />
    </svg>
  `,
})
export class SunIcon {}
