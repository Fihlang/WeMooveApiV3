import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryService } from '../../core/services/delivery.service';
import { AuthService } from '../../core/services/auth.service';
import { Address } from '../../core/models/address.model';
import { Package, PackageTypes } from '../../core/models/package.model';
import { Driver } from '../../core/models/driver.model';

@Component({
  selector: 'app-place-order',
  templateUrl: './place-order.component.html',
  styleUrls: ['./place-order.component.scss']
})
export class PlaceOrderComponent implements OnInit {
  // Forms
  deliveryForm: FormGroup;
  parcelDetailsForm: FormGroup;
  furnitureItemsForm: FormGroup;
  
  // State variables
  deliveryType: 'furniture' | 'parcel' = 'furniture';
  step = 1;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  
  // Data
  userAddresses: Address[] = [];
  availableDrivers: Driver[] = [];
  
  // Map variables
  pickupCoordinates: { latitude: number; longitude: number } | null = null;
  dropoffCoordinates: { latitude: number; longitude: number } | null = null;
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private deliveryService: DeliveryService,
    private authService: AuthService
  ) {
    // Initialize delivery form
    this.deliveryForm = this.fb.group({
      pickupAddressId: [null, Validators.required],
      dropoffAddressId: [null, Validators.required],
      scheduledPickupTime: [null, Validators.required],
      notes: [''],
      requiredVehicleType: ['truck', Validators.required],
      paymentMethod: ['cash', Validators.required]
    });
    
    // Initialize parcel form
    this.parcelDetailsForm = this.fb.group({
      type: [PackageTypes.PARCEL, Validators.required],
      name: ['', Validators.required],
      description: [''],
      weight: [null, [Validators.required, Validators.min(0.1), Validators.max(20)]],
      length: [null, [Validators.min(1), Validators.max(100)]],
      width: [null, [Validators.min(1), Validators.max(100)]],
      height: [null, [Validators.min(1), Validators.max(100)]],
      isFragile: [false],
      requiresSpecialHandling: [false],
      photoUrl: ['']
    });
    
    // Initialize furniture items form
    this.furnitureItemsForm = this.fb.group({
      items: this.fb.array([])
    });
  }

  ngOnInit(): void {
    // Load user's addresses
    this.loadUserAddresses();
    
    // Update vehicle type when delivery type changes
    this.onDeliveryTypeChange(this.deliveryType);
  }
  
  loadUserAddresses(): void {
    // TODO: Implement address loading from service
    this.userAddresses = [];
  }
  
  onDeliveryTypeChange(type: 'furniture' | 'parcel'): void {
    this.deliveryType = type;
    
    // Update vehicle type based on delivery type
    if (type === 'parcel') {
      this.deliveryForm.patchValue({
        requiredVehicleType: 'motorbike'
      });
    } else {
      this.deliveryForm.patchValue({
        requiredVehicleType: 'truck'
      });
    }
  }
  
  nextStep(): void {
    if (this.step < 3) {
      this.step++;
    }
  }
  
  prevStep(): void {
    if (this.step > 1) {
      this.step--;
    }
  }
  
  findAvailableDrivers(): void {
    if (!this.pickupCoordinates) {
      this.error = 'Cannot find drivers without pickup coordinates';
      return;
    }
    
    this.isLoading = true;
    const isParcelDelivery = this.deliveryType === 'parcel';
    const vehicleType = this.deliveryForm.get('requiredVehicleType')?.value;
    
    this.deliveryService.getAvailableDrivers(
      this.pickupCoordinates.latitude,
      this.pickupCoordinates.longitude,
      10, // 10 km radius 
      isParcelDelivery,
      vehicleType
    ).subscribe({
      next: (drivers) => {
        this.availableDrivers = drivers;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error finding drivers:', err);
        this.error = 'Failed to find available drivers. Please try again.';
        this.isLoading = false;
      }
    });
  }
  
  submitDeliveryRequest(): void {
    this.isLoading = true;
    this.error = null;
    this.success = null;
    
    if (!this.deliveryForm.valid) {
      this.error = 'Please fill in all required delivery details';
      this.isLoading = false;
      return;
    }
    
    // Prepare common delivery data
    const deliveryData = {
      ...this.deliveryForm.value,
      pickupCoordinates: this.pickupCoordinates,
      dropoffCoordinates: this.dropoffCoordinates,
      findDriver: true,
      price: this.calculateDeliveryPrice()
    };
    
    if (this.deliveryType === 'parcel') {
      // Submit parcel delivery
      if (!this.parcelDetailsForm.valid) {
        this.error = 'Please fill in all required parcel details';
        this.isLoading = false;
        return;
      }
      
      const parcelDeliveryData = {
        ...deliveryData,
        parcel: this.parcelDetailsForm.value
      };
      
      this.deliveryService.createParcelDelivery(parcelDeliveryData).subscribe({
        next: (response) => {
          this.success = 'Parcel delivery request submitted successfully';
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/customer/dashboard']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error creating parcel delivery:', err);
          this.error = 'Failed to create parcel delivery request. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      // Submit furniture delivery
      // Add furniture items handling logic here
      const furnitureDeliveryData = {
        ...deliveryData,
        furnitureItems: []
      };
      
      this.deliveryService.createFurnitureDelivery(furnitureDeliveryData).subscribe({
        next: (response) => {
          this.success = 'Furniture delivery request submitted successfully';
          this.isLoading = false;
          setTimeout(() => {
            this.router.navigate(['/customer/dashboard']);
          }, 2000);
        },
        error: (err) => {
          console.error('Error creating furniture delivery:', err);
          this.error = 'Failed to create furniture delivery request. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }
  
  private calculateDeliveryPrice(): number {
    // Simple price calculation based on delivery type
    let basePrice = this.deliveryType === 'parcel' ? 15 : 50;
    
    // Add weight surcharge for parcels
    if (this.deliveryType === 'parcel') {
      const weight = this.parcelDetailsForm.get('weight')?.value || 0;
      if (weight > 5) {
        basePrice += (weight - 5) * 2; // $2 per kg over 5kg
      }
      
      // Add fee for fragile items
      if (this.parcelDetailsForm.get('isFragile')?.value === true) {
        basePrice += 10;
      }
      
      // Add fee for special handling
      if (this.parcelDetailsForm.get('requiresSpecialHandling')?.value === true) {
        basePrice += 15;
      }
    }
    
    return basePrice;
  }
}