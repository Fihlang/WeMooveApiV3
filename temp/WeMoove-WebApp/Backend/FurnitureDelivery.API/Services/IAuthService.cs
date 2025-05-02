using FurnitureDelivery.API.Models;

namespace FurnitureDelivery.API.Services
{
    public interface IAuthService
    {
        /// <summary>
        /// Generates a JWT token for the user
        /// </summary>
        /// <param name="user">The user to generate a token for</param>
        /// <returns>The JWT token string</returns>
        string GenerateJwtToken(User user);
        
        /// <summary>
        /// Validates a JWT token
        /// </summary>
        /// <param name="token">The token to validate</param>
        /// <returns>True if the token is valid, false otherwise</returns>
        bool ValidateToken(string token);
        
        /// <summary>
        /// Creates a password hash and salt
        /// </summary>
        /// <param name="password">The password to hash</param>
        /// <returns>The password hash and salt</returns>
        (byte[] passwordHash, byte[] passwordSalt) HashPassword(string password);
        
        /// <summary>
        /// Verifies a password against a hash and salt
        /// </summary>
        /// <param name="password">The password to verify</param>
        /// <param name="storedHash">The stored password hash</param>
        /// <param name="storedSalt">The stored password salt</param>
        /// <returns>True if the password is valid, false otherwise</returns>
        bool VerifyPassword(string password, byte[] storedHash, byte[] storedSalt);
    }
}