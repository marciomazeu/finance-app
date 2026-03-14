using FinanceApp.Domain.Entities;

namespace FinanceApp.Domain.Interfaces;

public interface ITransactionRepository
{
    Task AddAsync(Transaction transaction);
    // Adicionamos startDate e endDate opcionais
    Task<IEnumerable<Transaction>> GetAllAsync(DateTime? startDate = null, DateTime? endDate = null);

    Task DeleteAsync(int id);
    Task<Transaction?> GetByIdAsync(int id); // Precisamos achar antes de deletar
}