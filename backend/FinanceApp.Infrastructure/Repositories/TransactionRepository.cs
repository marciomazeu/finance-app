using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Domain.Interfaces;
using FinanceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using FinanceApp.Domain.DTOs;

namespace FinanceApp.Infrastructure.Repositories;

public class TransactionRepository : ITransactionRepository
{
    private readonly AppDbContext _context;

    public TransactionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Transaction transaction)
    {
        await _context.Transactions.AddAsync(transaction);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Transaction>> GetAllAsync()
    {
        return await _context.Transactions.ToListAsync();
    }

    public async Task<IEnumerable<Transaction>> GetAllAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
    IQueryable<Transaction> query = _context.Transactions;

    if (startDate.HasValue)
    {
        query = query.Where(t => t.Date >= startDate.Value);
    }

    if (endDate.HasValue)
    {
        query = query.Where(t => t.Date <= endDate.Value);
    }

    return await query.OrderByDescending(t => t.Date).ToListAsync();
    }

    public async Task<Transaction?> GetByIdAsync(int id)
{
    return await _context.Transactions.FindAsync(id);
}

public async Task DeleteAsync(int id)
{
    var transaction = await GetByIdAsync(id);
    if (transaction != null)
    {
        _context.Transactions.Remove(transaction);
        await _context.SaveChangesAsync();
    }
}

public async Task UpdateAsync(Transaction transaction)
{
    _context.Transactions.Update(transaction);
    await _context.SaveChangesAsync();
}

public async Task<DashboardResponse> GetDashboardAsync(DateTime? startDate = null, DateTime? endDate = null)
{
    var query = _context.Transactions.AsQueryable();

    if (startDate.HasValue) query = query.Where(t => t.Date >= startDate.Value);
    if (endDate.HasValue) query = query.Where(t => t.Date <= endDate.Value);

    var transactions = await query.ToListAsync();

    // Type 1 = Entrada, Type 2 = Saída (Ajuste conforme seus Enums)
    var incomes = transactions.Where(t => (int)t.Type == 1).Sum(t => t.Amount);
    var expenses = transactions.Where(t => (int)t.Type == 2).Sum(t => t.Amount);

    return new DashboardResponse(incomes, expenses, incomes - expenses);
}
}