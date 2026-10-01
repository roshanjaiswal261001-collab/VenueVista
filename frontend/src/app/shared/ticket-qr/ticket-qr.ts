import { NgIf } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { toDataURL } from 'qrcode';

// Ticket code ko QR image mein badalta hai (browser mein hi, server pe nahi)
@Component({
  selector: 'app-ticket-qr',
  standalone: true,
  imports: [NgIf],
  template: `<img *ngIf="dataUrl" [src]="dataUrl" [width]="size" [height]="size" [alt]="'QR code for ' + code" class="qr" />`,
  styles: ['.qr { display: block; border-radius: 6px; background: #fff; }']
})
export class TicketQr implements OnChanges {
  @Input({ required: true }) code = '';
  @Input() size = 120;
  dataUrl = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(): void {
    if (!this.code) {
      this.dataUrl = '';
      return;
    }
    toDataURL(this.code, { width: this.size * 2, margin: 1 })
      .then(url => {
        this.dataUrl = url;
        this.cdr.markForCheck();
      })
      .catch(err => console.error('QR error:', err));
  }
}
