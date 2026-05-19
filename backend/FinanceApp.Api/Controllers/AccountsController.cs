using FinanceApp.Infrastructure.Data;
using FinanceApp.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AccountsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AccountsController(AppDbContext context)
    {
        _context = context;
    }

    // Pega o ID do usuário diretamente do Token JWT que você já validou
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpPost]
public async Task<IActionResult> Create([FromBody] AccountRequest request)
{
    // Usando o construtor público que criamos em vez do inicializador de propriedades
    var account = new Account(request.Name, UserId,request.Balance);

    _context.Accounts.Add(account);
    await _context.SaveChangesAsync();
    
    return Ok(account);
}

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var accounts = await _context.Accounts
            .Where(a => a.UserId == UserId)
            .ToListAsync();
            
        return Ok(accounts);
    }
}

// DTO para receber os dados do Swagger de forma limpa
public record AccountRequest(string Name, decimal Balance);