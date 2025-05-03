import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerDashboardComponent } from './dashboard/customer-dashboard.component';
import { BookingsListComponent } from './bookings/bookings-list.component';
import { BookingDetailComponent } from './bookings/booking-detail.component';
import { ReviewSubmissionComponent } from './bookings/review-submission.component';
import { PlaceOrderComponent } from './place-order/place-order.component';
import { ProfessionalsListComponent } from './professionals/professionals-list.component';
import { ProfessionalDetailComponent } from './professionals/professional-detail.component';
import { ProfessionalBookingComponent } from './professionals/professional-booking.component';
import { OrderConfirmationComponent } from './place-order/order-confirmation.component';
import { AuthGuard } from '../core/guards/auth.guard';
import { CustomerGuard } from '../core/guards/customer.guard';

const routes: Routes = [
  {
    path: '',
    component: CustomerDashboardComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'place-order',
    component: PlaceOrderComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'order-confirmation/:id',
    component: OrderConfirmationComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'bookings',
    component: BookingsListComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'bookings/:id',
    component: BookingDetailComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'bookings/:id/review',
    component: ReviewSubmissionComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'professionals',
    component: ProfessionalsListComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'professionals/:id',
    component: ProfessionalDetailComponent,
    canActivate: [AuthGuard, CustomerGuard]
  },
  {
    path: 'professionals/:id/book',
    component: ProfessionalBookingComponent,
    canActivate: [AuthGuard, CustomerGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomerRoutingModule { }