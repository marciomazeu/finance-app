using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceApp.Infrastructure.Data;
using FinanceApp.Domain.Entities;
using FinanceApp.Application.DTOs;
using FinanceApp.Application.Interfaces;

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
}