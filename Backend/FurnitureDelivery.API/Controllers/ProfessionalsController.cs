using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using FurnitureDelivery.API.Models;
using FurnitureDelivery.API.DTOs;
using FurnitureDelivery.API.Services;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace FurnitureDelivery.API.Controllers
{
    [ApiController]
    [Route("api/professionals")]
    public class ProfessionalsController : ControllerBase
    {
        private readonly IProfessionalService _professionalService;
        private readonly IUserService _userService;
        private readonly IReviewService _reviewService;
        
        public ProfessionalsController(
            IProfessionalService professionalService,
            IUserService userService,
            IReviewService reviewService)
        {
            _professionalService = professionalService;
            _userService = userService;
            _reviewService = reviewService;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProfessionalResponseDTO>>> GetAllProfessionals()
        {
            var professionals = await _professionalService.GetAllProfessionalsAsync();
            return Ok(professionals);
        }
        
        [HttpGet("skill/{skill}")]
        public async Task<ActionResult<IEnumerable<ProfessionalResponseDTO>>> GetProfessionalsBySkill(string skill)
        {
            if (string.IsNullOrWhiteSpace(skill))
            {
                return BadRequest("Skill must be provided");
            }
            
            var professionals = await _professionalService.GetProfessionalsBySkillAsync(skill);
            return Ok(professionals);
        }
        
        [HttpGet("{id}")]
        public async Task<ActionResult<ProfessionalResponseDTO>> GetProfessional(int id)
        {
            var professional = await _professionalService.GetProfessionalByIdAsync(id);
            
            if (professional == null)
            {
                return NotFound();
            }
            
            return Ok(professional);
        }
        
        [HttpGet("{id}/reviews")]
        public async Task<ActionResult<IEnumerable<ReviewResponseDTO>>> GetProfessionalReviews(int id)
        {
            var reviews = await _reviewService.GetReviewsByProfessionalIdAsync(id);
            return Ok(reviews);
        }
        
        [HttpGet("{id}/rating")]
        public async Task<ActionResult<ProfessionalRatingDTO>> GetProfessionalRating(int id)
        {
            var rating = await _reviewService.GetAverageProfessionalRatingAsync(id);
            return Ok(new ProfessionalRatingDTO { ProfessionalId = id, AverageRating = rating.Average, TotalReviews = rating.Count });
        }
        
        [HttpGet("{id}/availability")]
        public async Task<ActionResult<AvailabilityResponseDTO>> GetProfessionalAvailability(int id, [FromQuery] DateTime date)
        {
            var availability = await _professionalService.GetProfessionalAvailabilityAsync(id, date);
            return Ok(availability);
        }
        
        [Authorize]
        [HttpPost]
        public async Task<ActionResult<ProfessionalResponseDTO>> CreateProfessional([FromBody] CreateProfessionalDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Only admin users can create professionals
            if (!User.IsInRole("Admin"))
            {
                return Forbid();
            }
            
            try
            {
                var professional = await _professionalService.CreateProfessionalAsync(model);
                return CreatedAtAction(nameof(GetProfessional), new { id = professional.Id }, professional);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [Authorize]
        [HttpPut("{id}")]
        public async Task<ActionResult<ProfessionalResponseDTO>> UpdateProfessional(int id, [FromBody] UpdateProfessionalDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Only admin users or the professional themselves can update
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            var professional = await _professionalService.GetProfessionalByIdAsync(id);
            
            if (professional == null)
            {
                return NotFound();
            }
            
            if (!User.IsInRole("Admin") && professional.UserId != currentUser.Id)
            {
                return Forbid();
            }
            
            try
            {
                var updatedProfessional = await _professionalService.UpdateProfessionalAsync(id, model);
                return Ok(updatedProfessional);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        
        [Authorize]
        [HttpPut("{id}/availability")]
        public async Task<ActionResult<ProfessionalResponseDTO>> UpdateAvailability(int id, [FromBody] UpdateAvailabilityDTO model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Only admin users or the professional themselves can update availability
            var currentUser = await _userService.GetUserFromClaimsAsync(User);
            var professional = await _professionalService.GetProfessionalByIdAsync(id);
            
            if (professional == null)
            {
                return NotFound();
            }
            
            if (!User.IsInRole("Admin") && professional.UserId != currentUser.Id)
            {
                return Forbid();
            }
            
            try
            {
                var updatedProfessional = await _professionalService.UpdateProfessionalAvailabilityAsync(id, model);
                return Ok(updatedProfessional);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}