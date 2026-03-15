using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceApp.Infrastructure.Data;
using FinanceApp.Domain.Entities;
using FinanceApp.Application.DTOs;
using FinanceApp.Application.Interfaces;
using FinanceApp.Domain.DTOs;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController : ControllerBase
{
    private readonly ITransactionService _service;

    public TransactionsController(ITransactionService service)
    {
        _service = service;
    }

   [HttpGet]
public async Task<ActionResult<IEnumerable<TransactionResponse>>> Get(
    [FromQuery] DateTime? startDate, 
    [FromQuery] DateTime? endDate) 
{
    var results = await _service.GetAllAsync(startDate, endDate);
    return Ok(results);
}

    [HttpPost]
    public async Task<ActionResult> Post(TransactionRequest request)
    {
        try 
        {
            await _service.CreateAsync(request);
            return Ok(new { message = "Transação criada com sucesso!" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var success = await _service.DeleteAsync(id);
        
        if (!success)
        {
            return NotFound(new { message = "Transação não encontrada." });
        }

        return NoContent();
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> Update(int id, [FromBody] TransactionRequest request)
    {
        var success = await _service.UpdateAsync(id, request);
        
        if (!success)
        {
            return NotFound(new { message = "Transação não encontrada para atualização." });
        }

        return NoContent(); // 204 significa que foi alterado com sucesso
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardResponse>> GetDashboard(
        [FromQuery] DateTime? startDate, 
        [FromQuery] DateTime? endDate)
    {
        var dashboard = await _service.GetBalanceAsync(startDate, endDate);
        return Ok(dashboard);
    }
}