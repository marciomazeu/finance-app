namespace FinanceApp.Application.DTOs;

public record LoginRequest(string Email, string Password);
public record LoginResponse(string Token, string UserName);