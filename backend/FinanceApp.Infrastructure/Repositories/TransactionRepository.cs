using FinanceApp.Domain.Entities;
using FinanceApp.Domain.Interfaces;
using FinanceApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

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
}