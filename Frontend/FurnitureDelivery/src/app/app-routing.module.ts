import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  // Public routes (no auth required)
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },
  
  // Auth routes
  { 
    path: 'auth', 
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent }
    ] 
  },
  
  // Customer routes (requires customer role)
  { 
    path: 'customer', 
    canActivate: [AuthGuard, RoleGuard],
    data: { requiredRole: 'customer' },
    children: [
      { path: 'dashboard', loadChildren: () => import('./customer/customer.module').then(m => m.CustomerModule) },
      // Additional customer routes will be added here
    ] 
  },
  
  // Driver routes (requires driver role)
  { 
    path: 'driver', 
    canActivate: [AuthGuard, RoleGuard],
    data: { requiredRole: 'driver' },
    children: [
      { path: 'dashboard', loadChildren: () => import('./driver/driver.module').then(m => m.DriverModule) },
      // Additional driver routes will be added here
    ] 
  },
  
  // Wildcard route for 404
  { path: '**', redirectTo: '/auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }