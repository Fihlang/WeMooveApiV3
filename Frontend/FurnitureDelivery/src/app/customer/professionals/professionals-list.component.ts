import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { 
  Professional, 
  ProfessionalSkill 
} from '../../core/models/professional.model';
import { ProfessionalService } from '../../core/services/professional.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-professionals-list',
  templateUrl: './professionals-list.component.html',
  styleUrls: ['./professionals-list.component.scss']
})
export class ProfessionalsListComponent implements OnInit, OnDestroy {
  professionals: Professional[] = [];
  filteredProfessionals: Professional[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Filter form
  filterForm: FormGroup;
  
  // Search
  searchText$ = new Subject<string>();
  searchSubscription: Subscription | null = null;
  
  // Enums for template
  ProfessionalSkill = ProfessionalSkill;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  
  // Map and location
  userLocation: { latitude: number, longitude: number } | null = null;
  
  constructor(
    private professionalService: ProfessionalService,
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      skill: [null],
      minRating: [0],
      maxPrice: [500],
      onlyAvailable: [true],
      sortBy: ['rating'] // 'rating', 'price', 'experience'
    });
  }

  ngOnInit(): void {
    // Get user's location
    this.getUserLocation();
    
    // Load professionals
    this.loadProfessionals();
    
    // Setup search with debounce
    this.searchSubscription = this.searchText$
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(text => {
        this.filterProfessionals(text);
      });
    
    // Listen for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
    
    // Subscribe to professional status updates
    this.subscribeToStatusUpdates();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  getUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          // Reload professionals with location
          this.loadProfessionals();
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }

  loadProfessionals(): void {
    this.isLoading = true;
    this.error = null;
    
    const filters = this.filterForm.value;
    const isAvailable = filters.onlyAvailable || undefined;
    
    // If we have user location, include it in the query
    if (this.userLocation) {
      this.professionalService.getProfessionals(
        filters.skill,
        this.userLocation.latitude,
        this.userLocation.longitude,
        20, // 20km radius
        isAvailable
      ).subscribe({
        next: (data) => {
          this.professionals = data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading professionals:', err);
          this.error = 'Failed to load professionals. Please try again.';
          this.isLoading = false;
        }
      });
    } else {
      // Without location, just get by skill and availability
      this.professionalService.getProfessionals(
        filters.skill,
        undefined,
        undefined,
        undefined,
        isAvailable
      ).subscribe({
        next: (data) => {
          this.professionals = data;
          this.applyFilters();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading professionals:', err);
          this.error = 'Failed to load professionals. Please try again.';
          this.isLoading = false;
        }
      });
    }
  }

  applyFilters(): void {
    const filters = this.filterForm.value;
    
    // Apply filters
    this.filteredProfessionals = this.professionals.filter(pro => {
      // Filter by min rating
      if (pro.rating < filters.minRating) {
        return false;
      }
      
      // Filter by max price
      if (pro.hourlyRate > filters.maxPrice) {
        return false;
      }
      
      // Filter by skill if selected
      if (filters.skill && pro.skills !== filters.skill && pro.skills !== ProfessionalSkill.BOTH) {
        return false;
      }
      
      // Filter by availability
      if (filters.onlyAvailable && !pro.isAvailable) {
        return false;
      }
      
      return true;
    });
    
    // Sort professionals
    this.sortProfessionals(filters.sortBy);
  }

  sortProfessionals(sortBy: string): void {
    switch (sortBy) {
      case 'rating':
        this.filteredProfessionals.sort((a, b) => b.rating - a.rating);
        break;
      case 'price':
        this.filteredProfessionals.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'experience':
        this.filteredProfessionals.sort((a, b) => b.yearsOfExperience - a.yearsOfExperience);
        break;
      default:
        // Default sort by rating
        this.filteredProfessionals.sort((a, b) => b.rating - a.rating);
    }
  }

  filterProfessionals(searchText: string): void {
    if (!searchText) {
      this.applyFilters();
      return;
    }
    
    const lowerCaseSearch = searchText.toLowerCase();
    
    this.filteredProfessionals = this.professionals.filter(pro => {
      // Match name
      if (pro.user && pro.user.firstName.toLowerCase().includes(lowerCaseSearch) || 
          pro.user && pro.user.lastName.toLowerCase().includes(lowerCaseSearch)) {
        return true;
      }
      
      // Match specialties
      if (pro.specialties.some(spec => spec.toLowerCase().includes(lowerCaseSearch))) {
        return true;
      }
      
      // Match biography
      if (pro.biography.toLowerCase().includes(lowerCaseSearch)) {
        return true;
      }
      
      return false;
    });
  }

  resetFilters(): void {
    this.filterForm.reset({
      skill: null,
      minRating: 0,
      maxPrice: 500,
      onlyAvailable: true,
      sortBy: 'rating'
    });
    
    this.applyFilters();
  }

  onSearch(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value;
    this.searchText$.next(searchValue);
  }

  viewProfessionalDetails(professional: Professional): void {
    this.router.navigate(['/customer/professionals', professional.id]);
  }

  bookProfessional(professional: Professional): void {
    this.router.navigate(['/customer/professionals', professional.id, 'book']);
  }

  getDistanceText(professional: Professional): string {
    if (!this.userLocation || !professional.currentLatitude || !professional.currentLongitude) {
      return 'Distance unknown';
    }
    
    const distance = this.calculateDistance(
      this.userLocation.latitude,
      this.userLocation.longitude,
      professional.currentLatitude,
      professional.currentLongitude
    );
    
    return `${distance.toFixed(1)} km away`;
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  getSkillLabel(skill: ProfessionalSkill): string {
    switch (skill) {
      case ProfessionalSkill.MOVING:
        return 'Moving Specialist';
      case ProfessionalSkill.ASSEMBLY:
        return 'Assembly Specialist';
      case ProfessionalSkill.BOTH:
        return 'Moving & Assembly Specialist';
      default:
        return 'Professional';
    }
  }

  getPagedProfessionals(): Professional[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredProfessionals.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredProfessionals.length / this.pageSize);
  }

  subscribeToStatusUpdates(): void {
    this.professionalService.subscribeToStatusUpdates((data) => {
      // Update availability status of professionals
      if (data && data.professionalId) {
        const index = this.professionals.findIndex(p => p.id === data.professionalId);
        if (index !== -1) {
          this.professionals[index].isAvailable = data.isAvailable;
          // Re-apply filters
          this.applyFilters();
        }
      }
    });
  }
}