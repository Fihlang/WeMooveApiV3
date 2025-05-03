import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DeliveryService } from '../../core/services/delivery.service';
import { AuthService } from '../../core/services/auth.service';
import { Address } from '../../core/models/address.model';
import { Package, PackageTypes } from '../../core/models/package.model';
import { Driver } from '../../core/models/driver.model';
import { FurnitureDeliveryOptions, ServiceTier, SERVICE_PRICING } from '../../core/models/furniture-delivery-options.model';

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
  furnitureOptionsForm: FormGroup;
  
  // State variables
  deliveryType: 'furniture' | 'parcel' = 'furniture';
  serviceTier: ServiceTier = ServiceTier.BASIC;
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
    
    // Initialize furniture options form
    this.furnitureOptionsForm = this.fb.group({
      requiresMovingAssistance: [false],
      requiresAssembly: [false],
      numberOfMovers: [2, [Validators.required, Validators.min(1), Validators.max(4)]],
      numberOfHeavyItems: [0, [Validators.required, Validators.min(0)]],
      hasStairs: [false],
      floorNumber: [0, [Validators.required, Validators.min(0)]],
      hasElevator: [false],
      specialInstructions: ['']
    });
  }

  ngOnInit(): void {
    // Load user's addresses
    this.loadUserAddresses();
    
    // Update vehicle type when delivery type changes
    this.onDeliveryTypeChange(this.deliveryType);
    
    // Watch for changes to moving assistance and assembly options to update service tier
    this.furnitureOptionsForm.get('requiresMovingAssistance')?.valueChanges.subscribe(
      value => this.updateServiceTier()
    );
    
    this.furnitureOptionsForm.get('requiresAssembly')?.valueChanges.subscribe(
      value => this.updateServiceTier()
    );
  }
  
  updateServiceTier(): void {
    const requiresMovingAssistance = this.furnitureOptionsForm.get('requiresMovingAssistance')?.value;
    const requiresAssembly = this.furnitureOptionsForm.get('requiresAssembly')?.value;
    
    if (requiresMovingAssistance && requiresAssembly) {
      this.serviceTier = ServiceTier.PREMIUM;
    } else if (requiresMovingAssistance) {
      this.serviceTier = ServiceTier.STANDARD;
    } else {
      this.serviceTier = ServiceTier.BASIC;
    }
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
      if (!this.furnitureOptionsForm.valid) {
        this.error = 'Please fill in all required furniture delivery details';
        this.isLoading = false;
        return;
      }
      
      // Get the furniture options
      const furnitureOptions: FurnitureDeliveryOptions = this.furnitureOptionsForm.value;
      
      // Create the delivery data with furniture options
      const furnitureDeliveryData = {
        ...deliveryData,
        furnitureItems: [],
        furnitureOptions,
        serviceTier: this.serviceTier
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
    if (this.deliveryType === 'parcel') {
      return this.calculateParcelDeliveryPrice();
    } else {
      return this.calculateFurnitureDeliveryPrice();
    }
  }
  
  private calculateParcelDeliveryPrice(): number {
    let basePrice = 15; // Base price for parcel delivery
    
    // Add weight surcharge
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
    
    return basePrice;
  }
  
  private calculateFurnitureDeliveryPrice(): number {
    // Get base price from the selected service tier
    let totalPrice = SERVICE_PRICING[this.serviceTier].basePrice;
    
    // Add fees for specific options based on the service tier
    if (this.serviceTier === ServiceTier.STANDARD || this.serviceTier === ServiceTier.PREMIUM) {
      // Moving assistance is already included in the base price
      
      // Add additional fees for heavy items
      const heavyItems = this.furnitureOptionsForm.get('numberOfHeavyItems')?.value || 0;
      if (heavyItems > 0) {
        totalPrice += heavyItems * SERVICE_PRICING.additionalFees.perHeavyItem;
      }
      
      // Add fees for floor number if there are stairs and no elevator
      const hasStairs = this.furnitureOptionsForm.get('hasStairs')?.value;
      const hasElevator = this.furnitureOptionsForm.get('hasElevator')?.value;
      const floorNumber = this.furnitureOptionsForm.get('floorNumber')?.value || 0;
      
      if (hasStairs && !hasElevator && floorNumber > 0) {
        totalPrice += floorNumber * SERVICE_PRICING.additionalFees.perFloor;
      }
      
      // Add fees for additional movers beyond 2
      const numberOfMovers = this.furnitureOptionsForm.get('numberOfMovers')?.value || 2;
      if (numberOfMovers > 2) {
        totalPrice += (numberOfMovers - 2) * SERVICE_PRICING.additionalFees.extraMover;
      }
    }
    
    return totalPrice;
  }
  
  getServiceTierLabel(tier: ServiceTier): string {
    switch (tier) {
      case ServiceTier.BASIC:
        return 'Basic (Delivery Only)';
      case ServiceTier.STANDARD:
        return 'Standard (Includes Moving Assistance)';
      case ServiceTier.PREMIUM:
        return 'Premium (Includes Moving Assistance & Assembly)';
      default:
        return 'Unknown';
    }
  }
}