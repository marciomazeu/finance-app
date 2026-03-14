using FinanceApp.Application.DTOs;

namespace FinanceApp.Application.Interfaces;

public interface ITransactionService
{
    Task<IEnumerable<TransactionResponse>> GetAllAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task CreateAsync(TransactionRequest request);

     Task<bool> DeleteAsync(int id);
}