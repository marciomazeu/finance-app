using FinanceApp.Application.DTOs;
using FinanceApp.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(UserRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        if (!result) return BadRequest("E-mail já cadastrado.");

        return Ok("Usuário registrado com sucesso!");
    }
}