using FinanceApp.Application.DTOs;

namespace FinanceApp.Application.Interfaces;
using FinanceApp.Domain.DTOs;

public interface ITransactionService
{
    Task<IEnumerable<TransactionResponse>> GetAllAsync(DateTime? startDate = null, DateTime? endDate = null);
    Task CreateAsync(TransactionRequest request);

     Task<bool> DeleteAsync(int id);

     Task<bool> UpdateAsync(int id, TransactionRequest request);

     Task<DashboardResponse> GetBalanceAsync(DateTime? startDate = null, DateTime? endDate = null);

     Task<IEnumerable<CategorySummaryResponse>> GetCategorySummaryAsync(DateTime? startDate = null, DateTime? endDate = null);
}