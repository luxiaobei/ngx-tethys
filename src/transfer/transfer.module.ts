import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThyTransferComponent } from './transfer.component';
import { ThyTransferListComponent } from './transfer-list.component';
import { ThyButtonModule } from '../button/button.module';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ThyIconModule } from '../icon';
import { ThyListModule } from '../list';
@NgModule({
    declarations: [ThyTransferComponent, ThyTransferListComponent],
    imports: [CommonModule, ThyButtonModule, DragDropModule, ThyIconModule, ThyListModule],
    exports: [ThyTransferComponent]
})
export class ThyTransferModule {}
