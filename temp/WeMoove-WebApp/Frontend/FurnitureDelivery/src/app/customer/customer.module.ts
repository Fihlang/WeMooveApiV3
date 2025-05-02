import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardComponent } from './dashboard/dashboard.component';
import { DeliveryTrackingComponent } from './delivery-tracking/delivery-tracking.component';
import { PlaceOrderComponent } from './place-order/place-order.component';
import { FurnitureCatalogComponent } from './furniture-catalog/furniture-catalog.component';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'track/:id', component: DeliveryTrackingComponent },
  { path: 'place-order', component: PlaceOrderComponent },
  { path: 'catalog', component: FurnitureCatalogComponent }
];

@NgModule({
  declarations: [
    DashboardComponent,
    DeliveryTrackingComponent,
    PlaceOrderComponent,
    FurnitureCatalogComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class CustomerModule { }