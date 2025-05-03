import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { CustomerRoutingModule } from './customer-routing.module';
import { SharedModule } from '../shared/shared.module';

import { CustomerDashboardComponent } from './dashboard/customer-dashboard.component';
import { PlaceOrderComponent } from './place-order/place-order.component';
import { OrderConfirmationComponent } from './place-order/order-confirmation.component';
import { ProfessionalsListComponent } from './professionals/professionals-list.component';
import { ProfessionalDetailComponent } from './professionals/professional-detail.component';
import { ProfessionalBookingComponent } from './professionals/professional-booking.component';
import { BookingsListComponent } from './bookings/bookings-list.component';
import { BookingDetailComponent } from './bookings/booking-detail.component';
import { ReviewSubmissionComponent } from './bookings/review-submission.component';

@NgModule({
  declarations: [
    CustomerDashboardComponent,
    PlaceOrderComponent,
    OrderConfirmationComponent,
    ProfessionalsListComponent,
    ProfessionalDetailComponent,
    ProfessionalBookingComponent,
    BookingsListComponent,
    BookingDetailComponent,
    ReviewSubmissionComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CustomerRoutingModule,
    SharedModule
  ],
  providers: []
})
export class CustomerModule { }