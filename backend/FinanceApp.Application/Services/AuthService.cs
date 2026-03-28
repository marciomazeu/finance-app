using BCrypt.Net;
using FinanceApp.Application.DTOs;
using FinanceApp.Application.Interfaces;
using FinanceApp.Domain.Entities;
using FinanceApp.Domain.Interfaces;

namespace FinanceApp.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository; // Você precisará criar essa interface

    public AuthService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<bool> RegisterAsync(UserRequest request)
    {
        // Verifica se o e-mail já existe
        var existingUser = await _userRepository.GetByEmailAsync(request.Email);
        if (existingUser != null) return false;

        // CRIPTOGRAFIA: Transforma "123456" em "$2a$11$..."
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        var newUser = new User
        {
            Name = request.Name,
            Email = request.Email,
            PasswordHash = passwordHash
        };

        await _userRepository.AddAsync(newUser);
        return true;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        // Implementaremos o JWT aqui no próximo passo
        return null; 
    }
}