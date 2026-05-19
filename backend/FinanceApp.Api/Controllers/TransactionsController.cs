using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceApp.Infrastructure.Data;
using FinanceApp.Domain.Entities;
using FinanceApp.Application.DTOs;
using FinanceApp.Application.Interfaces;
using FinanceApp.Domain.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TransactionsController : ControllerBase
{
    protected int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    private readonly ITransactionService _service;

    public TransactionsController(ITransactionService service)
    {
        _service = service;
    }

    // MANTIDO: Este já usa o UserId do Token
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TransactionRequest request)
    {
        var result = await _service.AddAsync(request, UserId);
        return Ok(result);
    }

    // FUNDIDO: Agora é o único GET, aceita datas e filtra por User
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate) 
    {
        // Se o seu service ainda não aceita as datas no GetByUserAsync, 
        // você pode passar apenas o UserId por enquanto ou atualizar o service.
        var transactions = await _service.GetByUserAsync(UserId); 
        return Ok(transactions);
    }

    // REMOVIDOS: Deletei o 'Post' e o 'GetAll' duplicado para acabar com o conflito

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        // Importante: No futuro, o DeleteAsync também deve validar o UserId
        var success = await _service.DeleteAsync(id);
        if (!success) return NotFound(new { message = "Transação não encontrada." });
        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] TransactionRequest request)
    {
        var success = await _service.UpdateAsync(id, request);
        if (!success) return NotFound(new { message = "Transação não encontrada." });
        return NoContent();
    }

    // DASHBOARD: Lembre-se de passar o UserId para esses métodos no Service também!
   
    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardResponse>> GetDashboard([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        // UserId primeiro!
        return Ok(await _service.GetBalanceAsync(UserId, startDate, endDate));
    }

   [HttpGet("categories-summary")]
    public async Task<ActionResult<IEnumerable<CategorySummaryResponse>>> GetCategorySummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        // UserId primeiro!
        return Ok(await _service.GetCategorySummaryAsync(UserId, startDate, endDate));
    }
}