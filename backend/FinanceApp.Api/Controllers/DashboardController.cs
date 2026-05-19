using Microsoft.AspNetCore.Mvc;
using FinanceApp.Application.Interfaces;
using System.Security.Claims;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly ITransactionService _transactionService;

    public DashboardController(ITransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        // Pega o ID do usuário logado do Token JWT (o famoso ID 5)
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        var summary = await _transactionService.GetBalanceAsync(userId, startDate, endDate);
        return Ok(summary);
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategorySummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        
        var categories = await _transactionService.GetCategorySummaryAsync(userId, startDate, endDate);
        return Ok(categories);
    }
}