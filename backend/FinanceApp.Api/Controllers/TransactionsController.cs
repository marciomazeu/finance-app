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
    private readonly ITransactionService _transactionService;
    private readonly AppDbContext _context;

    public TransactionsController(ITransactionService transactionService, AppDbContext context)
    {
        _transactionService = transactionService;
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TransactionRequest request)
    {
        var account = await _context.Accounts.FindAsync(request.AccountId);
        if (account == null) return BadRequest("Conta não encontrada");

        var transType = request.Type == 1 ? TransactionType.Inflow : TransactionType.Outflow;
        var safeAmount = Math.Abs(request.Amount); 

        if (transType == TransactionType.Inflow)
            account.Credit(safeAmount);
        else
            account.Debit(safeAmount);

        var newTransaction = new Transaction(
            safeAmount,
            request.Date,
            request.Description,
            transType,
            request.CategoryId,
            request.AccountId
        );

        _context.Transactions.Add(newTransaction);
        _context.Entry(account).State = EntityState.Modified; // Garante alteração do saldo da conta
        await _context.SaveChangesAsync();

        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate) 
    {
        var transactions = await _transactionService.GetAllAsync(startDate, endDate);
        return Ok(transactions);
    }

    // CORRIGIDO: Agora deleta direto pelo Context ajustando o saldo da conta antes
    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(int id)
    {
        var transaction = await _context.Transactions.FindAsync(id);
        if (transaction == null) return NotFound(new { message = "Transação não encontrada." });

        var account = await _context.Accounts.FindAsync(transaction.AccountId);
        if (account != null)
        {
            // Se deletamos uma ENTRADA, o dinheiro sai da conta
            if (transaction.Type == TransactionType.Inflow)
                account.Debit(transaction.Amount);
            // Se deletamos uma SAÍDA, o dinheiro volta para a conta
            else if (transaction.Type == TransactionType.Outflow)
                account.Credit(transaction.Amount);

            _context.Entry(account).State = EntityState.Modified;
        }

        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPut("{id}")]
public async Task<IActionResult> Update(int id, [FromBody] TransactionRequest request)
{
    var existingTransaction = await _context.Transactions.FindAsync(id);
    if (existingTransaction == null) return NotFound();

    var account = await _context.Accounts.FindAsync(request.AccountId);
    if (account == null) return BadRequest("Conta não encontrada");

    var safeAmount = Math.Abs(request.Amount);
    var novoTipo = request.Type == 1 ? TransactionType.Inflow : TransactionType.Outflow;

    // Estorna o valor antigo da conta corrente
    if (existingTransaction.Type == TransactionType.Inflow)
        account.Debit(existingTransaction.Amount); 
    else
        account.Credit(existingTransaction.Amount); 

    // Aplica o valor novo na conta corrente
    if (novoTipo == TransactionType.Inflow)
        account.Credit(safeAmount);
    else
        account.Debit(safeAmount);

    // 1. Atualiza a entidade pelo método de domínio (incluindo a data nova)
    existingTransaction.Update(
        safeAmount,
        request.Description,
        novoTipo,
        request.CategoryId,
        request.AccountId,
        request.Date
    );
    
    // 2. Avisa explicitamente o EF que o estado da transação inteira mudou
    _context.Entry(existingTransaction).State = EntityState.Modified;
    
    // 3. Avisa o EF que o estado da conta (saldo atualizado) mudou
    _context.Entry(account).State = EntityState.Modified; 

    await _context.SaveChangesAsync();
    return Ok();
}

    [HttpGet("categories-summary")]
    public async Task<ActionResult<IEnumerable<CategorySummaryResponse>>> GetCategorySummary([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        return Ok(await _transactionService.GetCategorySummaryAsync(startDate, endDate));
    }

    [HttpGet("balance-trend")]
public async Task<IActionResult> GetBalanceTrend([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
{
    var inicio = startDate ?? DateTime.UtcNow.AddDays(-30);
    var fim = endDate ?? DateTime.UtcNow;

    // 1. Pega o saldo atual total somando todas as contas do usuário
    var currentBalance = await _context.Accounts.SumAsync(a => a.Balance);

    // 2. Busca todas as transações ordenadas da mais nova para a mais antiga
    var transactions = await _context.Transactions
        .Where(t => t.Date >= inicio && t.Date <= fim)
        .OrderByDescending(t => t.Date)
        .ToListAsync();

    var trend = new List<BalanceTrendResponse>();
    var runningBalance = currentBalance;

    // Adiciona o ponto de hoje
    trend.Add(new BalanceTrendResponse(fim.ToString("dd/MM"), runningBalance));

    // 3. Anda para trás no tempo, desfazendo o efeito das transações para achar o saldo histórico
    var groupedTransactions = transactions.GroupBy(t => t.Date.Date);

    foreach (var group in groupedTransactions)
    {
        foreach (var t in group)
        {
            // Se foi receita, no passado o saldo era MENOR
            if (t.Type == TransactionType.Inflow)
                runningBalance -= t.Amount;
            // Se foi despesa, no passado o saldo era MAIOR
            else
                runningBalance += t.Amount;
        }

        trend.Add(new BalanceTrendResponse(group.Key.ToString("dd/MM"), runningBalance));
    }

    // Inverte para ficar na ordem cronológica correta (passado -> presente)
    trend.Reverse();

    return Ok(trend);
}
}