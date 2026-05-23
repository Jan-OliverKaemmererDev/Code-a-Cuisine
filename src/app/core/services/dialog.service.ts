import { Injectable, signal } from '@angular/core';

export interface DialogState {
  message: string;
  isVisible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DialogService {
  private state = signal<DialogState>({
    message: '',
    isVisible: false
  });

  readonly dialogState = this.state.asReadonly();

  showError(message: string): void {
    this.state.set({ message, isVisible: true });
  }

  closeDialog(): void {
    this.state.update(s => ({ ...s, isVisible: false }));
  }
}
