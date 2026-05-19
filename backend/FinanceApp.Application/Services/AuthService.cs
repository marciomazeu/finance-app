using BCrypt.Net;
using FinanceApp.Application.DTOs;
using FinanceApp.Application.Interfaces;
using FinanceApp.Domain.Entities;
using FinanceApp.Domain.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration; // Para o _configuration
using Microsoft.IdentityModel.Tokens;

namespace FinanceApp.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository; // Você precisará criar essa interface
    private readonly IConfiguration _configuration;

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
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
        var user = await _userRepository.GetByEmailAsync(request.Email);
    if (user == null) return null;

    // Verifica se a senha bate com o Hash do banco
    bool isValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
    if (!isValid) return null;

    // Se chegou aqui, a senha está correta. Vamos gerar o Token:
    var token = GenerateJwtToken(user);

    return new LoginResponse(token, user.Name);
    }

    private string GenerateJwtToken(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:Secret"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.Now.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpiryMinutes"])),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}