import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { 
  ProfessionalWithReviews, 
  ProfessionalReview, 
  ProfessionalSkill 
} from '../../core/models/professional.model';
import { ProfessionalService } from '../../core/services/professional.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-professional-detail',
  templateUrl: './professional-detail.component.html',
  styleUrls: ['./professional-detail.component.scss']
})
export class ProfessionalDetailComponent implements OnInit, OnDestroy {
  professionalId: number = 0;
  professional: ProfessionalWithReviews | null = null;
  reviews: ProfessionalReview[] = [];
  isLoading = true;
  error: string | null = null;
  
  // Status subscription
  statusSubscription: Subscription | null = null;
  
  // Enums for template
  ProfessionalSkill = ProfessionalSkill;
  
  // Reviews pagination
  currentPage = 1;
  pageSize = 5;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private professionalService: ProfessionalService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.professionalId = +params['id'];
      this.loadProfessionalDetails();
    });
    
    // Subscribe to status updates
    this.subscribeToStatusUpdates();
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
  }

  loadProfessionalDetails(): void {
    this.isLoading = true;
    this.error = null;
    
    this.professionalService.getProfessionalWithReviews(this.professionalId).subscribe({
      next: (data) => {
        this.professional = data;
        this.reviews = data.recentReviews || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading professional details:', err);
        this.error = 'Failed to load professional details. Please try again.';
        this.isLoading = false;
      }
    });
  }

  loadAllReviews(): void {
    this.professionalService.getProfessionalReviews(this.professionalId).subscribe({
      next: (data) => {
        this.reviews = data;
      },
      error: (err) => {
        console.error('Error loading reviews:', err);
      }
    });
  }

  bookProfessional(): void {
    this.router.navigate(['/customer/professionals', this.professionalId, 'book']);
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

  getPagedReviews(): ProfessionalReview[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.reviews.slice(startIndex, endIndex);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  getTotalPages(): number {
    return Math.ceil(this.reviews.length / this.pageSize);
  }

  getStarArray(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;
    
    const stars = [];
    
    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(1);
    }
    
    // Add half star if needed
    if (halfStar) {
      stars.push(0.5);
    }
    
    // Add empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(0);
    }
    
    return stars;
  }

  subscribeToStatusUpdates(): void {
    this.statusSubscription = new Subscription();
    
    this.professionalService.subscribeToStatusUpdates((data) => {
      // Update availability status of the professional
      if (data && data.professionalId === this.professionalId && this.professional) {
        this.professional.isAvailable = data.isAvailable;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/customer/professionals']);
  }
  
  isLastReview(review: ProfessionalReview): boolean {
    const pagedReviews = this.getPagedReviews();
    return pagedReviews[pagedReviews.length - 1] === review;
  }
}