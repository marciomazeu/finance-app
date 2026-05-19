using FinanceApp.Application.DTOs;

namespace FinanceApp.Application.Interfaces;

public interface IAuthService
{
    Task<bool> RegisterAsync(UserRequest request);
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}