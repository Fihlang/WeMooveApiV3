using System.Security.Claims;
using FurnitureDelivery.API.Data;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FurnitureDelivery.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FurnitureController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;

        public FurnitureController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<FurnitureDTO>>>> GetFurniture()
        {
            var furniture = await _dbContext.Furniture
                .OrderBy(f => f.Category)
                .ThenBy(f => f.Name)
                .ToListAsync();

            var furnitureDTOs = furniture.Select(f => new FurnitureDTO
            {
                Id = f.Id,
                Name = f.Name,
                Description = f.Description,
                Weight = f.Weight,
                Dimensions = f.DimensionsJson,
                Category = f.Category,
                ImageUrl = f.ImageUrl
            }).ToList();

            return Ok(ApiResponse<List<FurnitureDTO>>.SuccessResponse(furnitureDTOs));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<FurnitureDTO>>> GetFurnitureById(int id)
        {
            var furniture = await _dbContext.Furniture.FindAsync(id);

            if (furniture == null)
            {
                return NotFound(ApiResponse<FurnitureDTO>.ErrorResponse("Furniture not found"));
            }

            var furnitureDTO = new FurnitureDTO
            {
                Id = furniture.Id,
                Name = furniture.Name,
                Description = furniture.Description,
                Weight = furniture.Weight,
                Dimensions = furniture.DimensionsJson,
                Category = furniture.Category,
                ImageUrl = furniture.ImageUrl
            };

            return Ok(ApiResponse<FurnitureDTO>.SuccessResponse(furnitureDTO));
        }

        [HttpGet("category/{category}")]
        public async Task<ActionResult<ApiResponse<List<FurnitureDTO>>>> GetFurnitureByCategory(string category)
        {
            var furniture = await _dbContext.Furniture
                .Where(f => f.Category.ToLower() == category.ToLower())
                .OrderBy(f => f.Name)
                .ToListAsync();

            var furnitureDTOs = furniture.Select(f => new FurnitureDTO
            {
                Id = f.Id,
                Name = f.Name,
                Description = f.Description,
                Weight = f.Weight,
                Dimensions = f.DimensionsJson,
                Category = f.Category,
                ImageUrl = f.ImageUrl
            }).ToList();

            return Ok(ApiResponse<List<FurnitureDTO>>.SuccessResponse(furnitureDTOs));
        }

        [HttpGet("categories")]
        public async Task<ActionResult<ApiResponse<List<string>>>> GetCategories()
        {
            var categories = await _dbContext.Furniture
                .Select(f => f.Category)
                .Distinct()
                .OrderBy(c => c)
                .ToListAsync();

            return Ok(ApiResponse<List<string>>.SuccessResponse(categories));
        }

        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<FurnitureDTO>>> CreateFurniture([FromBody] FurnitureDTO furnitureDTO)
        {
            // Validate required fields
            if (string.IsNullOrEmpty(furnitureDTO.Name) || 
                furnitureDTO.Weight <= 0 || 
                string.IsNullOrEmpty(furnitureDTO.Category))
            {
                return BadRequest(ApiResponse<FurnitureDTO>.ErrorResponse(
                    "Name, weight, and category are required fields"));
            }

            // Create new furniture
            var furniture = new Furniture
            {
                Name = furnitureDTO.Name,
                Description = furnitureDTO.Description,
                Weight = furnitureDTO.Weight,
                DimensionsJson = furnitureDTO.Dimensions,
                Category = furnitureDTO.Category,
                ImageUrl = furnitureDTO.ImageUrl
            };

            _dbContext.Furniture.Add(furniture);
            await _dbContext.SaveChangesAsync();

            // Map to DTO with ID
            furnitureDTO.Id = furniture.Id;

            return CreatedAtAction(
                nameof(GetFurnitureById),
                new { id = furniture.Id },
                ApiResponse<FurnitureDTO>.SuccessResponse(furnitureDTO, "Furniture created successfully")
            );
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<FurnitureDTO>>> UpdateFurniture(int id, [FromBody] FurnitureDTO furnitureDTO)
        {
            var furniture = await _dbContext.Furniture.FindAsync(id);

            if (furniture == null)
            {
                return NotFound(ApiResponse<FurnitureDTO>.ErrorResponse("Furniture not found"));
            }

            // Update properties
            furniture.Name = furnitureDTO.Name;
            furniture.Description = furnitureDTO.Description;
            furniture.Weight = furnitureDTO.Weight;
            furniture.DimensionsJson = furnitureDTO.Dimensions;
            furniture.Category = furnitureDTO.Category;
            furniture.ImageUrl = furnitureDTO.ImageUrl;

            await _dbContext.SaveChangesAsync();

            // Map to DTO
            furnitureDTO.Id = furniture.Id;

            return Ok(ApiResponse<FurnitureDTO>.SuccessResponse(furnitureDTO, "Furniture updated successfully"));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteFurniture(int id)
        {
            var furniture = await _dbContext.Furniture.FindAsync(id);

            if (furniture == null)
            {
                return NotFound(ApiResponse<bool>.ErrorResponse("Furniture not found"));
            }

            // Check if furniture is in use in any delivery
            var isInUse = await _dbContext.DeliveryItems.AnyAsync(di => di.FurnitureId == id);
            if (isInUse)
            {
                return BadRequest(ApiResponse<bool>.ErrorResponse(
                    "Cannot delete furniture that is associated with existing deliveries"));
            }

            _dbContext.Furniture.Remove(furniture);
            await _dbContext.SaveChangesAsync();

            return Ok(ApiResponse<bool>.SuccessResponse(true, "Furniture deleted successfully"));
        }
    }
}