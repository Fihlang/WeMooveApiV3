namespace FurnitureDelivery.API.Models
{
    /// <summary>
    /// Generic API response wrapper for consistent response formatting
    /// </summary>
    /// <typeparam name="T">The type of data being returned</typeparam>
    public class ApiResponse<T>
    {
        /// <summary>
        /// Indicates whether the request was successful
        /// </summary>
        public bool Success { get; set; }
        
        /// <summary>
        /// Optional message providing additional information about the response
        /// </summary>
        public string Message { get; set; }
        
        /// <summary>
        /// The data payload of the response (may be null for error responses)
        /// </summary>
        public T Data { get; set; }

        /// <summary>
        /// Create a successful response with data
        /// </summary>
        /// <param name="data">The data to include in the response</param>
        /// <param name="message">Optional success message</param>
        /// <returns>A successful API response containing the data</returns>
        public static ApiResponse<T> SuccessResponse(T data, string message = "")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data
            };
        }

        /// <summary>
        /// Create an error response
        /// </summary>
        /// <param name="message">Error message explaining what went wrong</param>
        /// <returns>An error API response with no data</returns>
        public static ApiResponse<T> ErrorResponse(string message)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default(T)
            };
        }
    }
}