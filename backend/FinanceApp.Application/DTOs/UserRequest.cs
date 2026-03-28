namespace FinanceApp.Application.DTOs;

public record UserRequest(
    string Name,
    string Email,
    string Password
);