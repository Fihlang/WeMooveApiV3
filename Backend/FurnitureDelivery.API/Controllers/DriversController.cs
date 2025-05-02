using System.Security.Claims;
using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using FurnitureDelivery.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureDelivery.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DriversController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IWebSocketService _webSocketService;
        private readonly INotificationService _notificationService;

        public DriversController(
            ApplicationDbContext dbContext,
            IWebSocketService webSocketService,
            INotificationService notificationService)
        {
            _dbContext = dbContext;
            _webSocketService = webSocketService;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<DriverDTO>>>> GetDrivers()
        {
            var drivers = await _dbContext.Drivers
                .Include(d => d.User)
                .Where(d => d.IsAvailable && d.VerificationStatus == "verified")
                .OrderByDescending(d => d.Rating)
                .ToListAsync();

            var driverDTOs = drivers.Select(d => new DriverDTO
            {
                Id = d.Id,
                UserId = d.UserId,
                VehicleType = d.VehicleType,
                LicensePlate = d.LicensePlate,
                Capacity = d.Capacity,
                Rating = d.Rating,
                IsAvailable = d.IsAvailable,
                CurrentLatitude = d.CurrentLatitude,
                CurrentLongitude = d.CurrentLongitude,
                VerificationStatus = d.VerificationStatus,
                SupportsParcel = d.SupportsParcel
            }).ToList();

            return Ok(ApiResponse<List<DriverDTO>>.SuccessResponse(driverDTOs));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<DriverDTO>>> GetDriver(int id)
        {
            var driver = await _dbContext.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (driver == null)
            {
                return NotFound(ApiResponse<DriverDTO>.ErrorResponse("Driver not found"));
            }

            var driverDTO = new DriverDTO
            {
                Id = driver.Id,
                UserId = driver.UserId,
                VehicleType = driver.VehicleType,
                LicensePlate = driver.LicensePlate,
                Capacity = driver.Capacity,
                Rating = driver.Rating,
                IsAvailable = driver.IsAvailable,
                CurrentLatitude = driver.CurrentLatitude,
                CurrentLongitude = driver.CurrentLongitude,
                VerificationStatus = driver.VerificationStatus,
                SupportsParcel = driver.SupportsParcel
            };

            return Ok(ApiResponse<DriverDTO>.SuccessResponse(driverDTO));
        }

        [HttpGet("nearby")]
        public async Task<ActionResult<ApiResponse<List<DriverDTO>>>> GetDriversNearby([FromQuery] DriverNearbyRequest request)
        {
            // Validate request
            if (request.Latitude < -90 || request.Latitude > 90)
            {
                return BadRequest(ApiResponse<List<DriverDTO>>.ErrorResponse("Latitude must be between -90 and 90"));
            }

            if (request.Longitude < -180 || request.Longitude > 180)
            {
                return BadRequest(ApiResponse<List<DriverDTO>>.ErrorResponse("Longitude must be between -180 and 180"));
            }

            if (request.Radius <= 0 || request.Radius > 100)
            {
                return BadRequest(ApiResponse<List<DriverDTO>>.ErrorResponse("Radius must be between 0.1 and 100 km"));
            }

            // Build query for drivers
            var driversQuery = _dbContext.Drivers
                .Include(d => d.User)
                .Where(d => d.VerificationStatus == "verified" && 
                       d.CurrentLatitude != null && 
                       d.CurrentLongitude != null);
                
            // Apply availability filter if requested
            if (request.OnlyAvailable)
            {
                driversQuery = driversQuery.Where(d => d.IsAvailable);
            }
            
            // Apply vehicle type filter if provided
            if (!string.IsNullOrEmpty(request.VehicleType))
            {
                driversQuery = driversQuery.Where(d => d.VehicleType == request.VehicleType);
            }
            
            // Apply parcel support filter if requested
            if (request.ParcelDeliveryOnly)
            {
                driversQuery = driversQuery.Where(d => d.SupportsParcel == true);
            }
            
            // Execute query
            var drivers = await driversQuery.ToListAsync();

            // Filter drivers by distance
            var nearbyDrivers = drivers
                .Where(d => CalculateDistance(
                    request.Latitude, 
                    request.Longitude, 
                    d.CurrentLatitude.Value, 
                    d.CurrentLongitude.Value) <= request.Radius)
                .OrderBy(d => CalculateDistance(
                    request.Latitude, 
                    request.Longitude, 
                    d.CurrentLatitude.Value, 
                    d.CurrentLongitude.Value))
                .ToList();

            // Map to DTOs
            var driverDTOs = nearbyDrivers.Select(d => new DriverDTO
            {
                Id = d.Id,
                UserId = d.UserId,
                VehicleType = d.VehicleType,
                LicensePlate = d.LicensePlate,
                Capacity = d.Capacity,
                Rating = d.Rating,
                IsAvailable = d.IsAvailable,
                CurrentLatitude = d.CurrentLatitude,
                CurrentLongitude = d.CurrentLongitude,
                VerificationStatus = d.VerificationStatus,
                SupportsParcel = d.SupportsParcel
            }).ToList();

            return Ok(ApiResponse<List<DriverDTO>>.SuccessResponse(driverDTOs));
        }

        [HttpPut("location")]
        [Authorize(Roles = "driver")]
        public async Task<ActionResult<ApiResponse<DriverDTO>>> UpdateLocation([FromBody] UpdateDriverLocationRequest request)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<DriverDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get driver
            var driver = await _dbContext.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                return NotFound(ApiResponse<DriverDTO>.ErrorResponse("Driver record not found"));
            }

            // Update location
            driver.CurrentLatitude = request.Latitude;
            driver.CurrentLongitude = request.Longitude;

            await _dbContext.SaveChangesAsync();

            // Broadcast location update to relevant deliveries
            var activeDeliveries = await _dbContext.Deliveries
                .Where(d => d.DriverId == driver.Id && (d.Status == "assigned" || d.Status == "in_transit"))
                .ToListAsync();

            foreach (var delivery in activeDeliveries)
            {
                await _webSocketService.BroadcastLocationUpdate(driver.Id, request.Latitude, request.Longitude);
            }

            // Map to DTO
            var driverDTO = new DriverDTO
            {
                Id = driver.Id,
                UserId = driver.UserId,
                VehicleType = driver.VehicleType,
                LicensePlate = driver.LicensePlate,
                Capacity = driver.Capacity,
                Rating = driver.Rating,
                IsAvailable = driver.IsAvailable,
                CurrentLatitude = driver.CurrentLatitude,
                CurrentLongitude = driver.CurrentLongitude,
                VerificationStatus = driver.VerificationStatus
            };

            return Ok(ApiResponse<DriverDTO>.SuccessResponse(driverDTO, "Location updated successfully"));
        }

        [HttpPut("availability")]
        [Authorize(Roles = "driver")]
        public async Task<ActionResult<ApiResponse<DriverDTO>>> UpdateAvailability([FromBody] bool isAvailable)
        {
            // Get user ID from token claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return BadRequest(ApiResponse<DriverDTO>.ErrorResponse("Invalid user ID in token"));
            }

            // Get driver
            var driver = await _dbContext.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.UserId == userId);

            if (driver == null)
            {
                return NotFound(ApiResponse<DriverDTO>.ErrorResponse("Driver record not found"));
            }

            // Check if driver has active deliveries when trying to go offline
            if (!isAvailable)
            {
                var hasActiveDeliveries = await _dbContext.Deliveries
                    .AnyAsync(d => d.DriverId == driver.Id && 
                             (d.Status == "assigned" || d.Status == "in_transit"));

                if (hasActiveDeliveries)
                {
                    return BadRequest(ApiResponse<DriverDTO>.ErrorResponse(
                        "Cannot go offline while having active deliveries. Complete or cancel your current deliveries first."));
                }
            }

            // Update availability
            driver.IsAvailable = isAvailable;
            await _dbContext.SaveChangesAsync();

            // Map to DTO
            var driverDTO = new DriverDTO
            {
                Id = driver.Id,
                UserId = driver.UserId,
                VehicleType = driver.VehicleType,
                LicensePlate = driver.LicensePlate,
                Capacity = driver.Capacity,
                Rating = driver.Rating,
                IsAvailable = driver.IsAvailable,
                CurrentLatitude = driver.CurrentLatitude,
                CurrentLongitude = driver.CurrentLongitude,
                VerificationStatus = driver.VerificationStatus
            };

            var statusMessage = isAvailable ? "You are now available for deliveries" : "You are now offline";
            return Ok(ApiResponse<DriverDTO>.SuccessResponse(driverDTO, statusMessage));
        }

        [HttpGet("reviews/{driverId}")]
        public async Task<ActionResult<ApiResponse<List<ReviewResponseDTO>>>> GetDriverReviews(int driverId)
        {
            // Check if driver exists
            var driver = await _dbContext.Drivers.FindAsync(driverId);
            if (driver == null)
            {
                return NotFound(ApiResponse<List<ReviewResponseDTO>>.ErrorResponse("Driver not found"));
            }

            // Get reviews
            var reviews = await _dbContext.Reviews
                .Include(r => r.Customer)
                .Include(r => r.Driver)
                .ThenInclude(d => d.User)
                .Where(r => r.DriverId == driverId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            // Map to DTOs
            var reviewDTOs = reviews.Select(r => new ReviewResponseDTO
            {
                Id = r.Id,
                CreatedAt = r.CreatedAt,
                DeliveryId = r.DeliveryId,
                CustomerId = r.CustomerId,
                Customer = new UserDTO
                {
                    Id = r.Customer.Id,
                    Email = r.Customer.Email,
                    FirstName = r.Customer.FirstName,
                    LastName = r.Customer.LastName,
                    PhoneNumber = r.Customer.PhoneNumber,
                    Address = r.Customer.Address,
                    AvatarUrl = r.Customer.AvatarUrl,
                    IsVerified = r.Customer.IsVerified,
                    UserType = r.Customer.UserType
                },
                DriverId = r.DriverId,
                Driver = new DriverDTO
                {
                    Id = r.Driver.Id,
                    UserId = r.Driver.UserId,
                    VehicleType = r.Driver.VehicleType,
                    LicensePlate = r.Driver.LicensePlate,
                    Capacity = r.Driver.Capacity,
                    Rating = r.Driver.Rating,
                    IsAvailable = r.Driver.IsAvailable,
                    CurrentLatitude = r.Driver.CurrentLatitude,
                    CurrentLongitude = r.Driver.CurrentLongitude,
                    VerificationStatus = r.Driver.VerificationStatus,
                    SupportsParcel = r.Driver.SupportsParcel
                },
                Rating = r.Rating,
                Comment = r.Comment
            }).ToList();

            return Ok(ApiResponse<List<ReviewResponseDTO>>.SuccessResponse(reviewDTOs));
        }

        [HttpPut("verify/{driverId}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<DriverDTO>>> VerifyDriver(int driverId)
        {
            // Get driver
            var driver = await _dbContext.Drivers
                .Include(d => d.User)
                .FirstOrDefaultAsync(d => d.Id == driverId);

            if (driver == null)
            {
                return NotFound(ApiResponse<DriverDTO>.ErrorResponse("Driver not found"));
            }

            // Update verification status
            driver.VerificationStatus = "verified";
            await _dbContext.SaveChangesAsync();

            // Send notification to driver
            await _notificationService.CreateNotification(
                driver.UserId,
                "success",
                "Account Verified",
                "Your driver account has been verified. You can now accept delivery requests.",
                "driver",
                driver.Id);

            // Map to DTO
            var driverDTO = new DriverDTO
            {
                Id = driver.Id,
                UserId = driver.UserId,
                VehicleType = driver.VehicleType,
                LicensePlate = driver.LicensePlate,
                Capacity = driver.Capacity,
                Rating = driver.Rating,
                IsAvailable = driver.IsAvailable,
                CurrentLatitude = driver.CurrentLatitude,
                CurrentLongitude = driver.CurrentLongitude,
                VerificationStatus = driver.VerificationStatus
            };

            return Ok(ApiResponse<DriverDTO>.SuccessResponse(driverDTO, "Driver verified successfully"));
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            // Haversine formula to calculate distance between two coordinates in kilometers
            const double earthRadius = 6371; // Earth's radius in kilometers

            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);

            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var distance = earthRadius * c;

            return distance;
        }

        private double ToRadians(double degrees)
        {
            return degrees * Math.PI / 180;
        }
    }
}