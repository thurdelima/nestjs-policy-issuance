import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, User } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: false,
  template: `
    <mat-toolbar color="primary">
      <span>Porto Bank Digital - Sistema de Apólices</span>
      <span class="spacer"></span>
      <div *ngIf="currentUser" class="user-info">
        <span>{{ currentUser.name }}</span>
        <button mat-icon-button (click)="logout()" matTooltip="Sair">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  `]
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
