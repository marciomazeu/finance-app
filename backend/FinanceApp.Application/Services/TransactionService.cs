using AutoMapper;
using FinanceApp.Application.Interfaces;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Domain.Interfaces;
using FinanceApp.Domain.DTOs;

namespace FinanceApp.Application.Services;

public class TransactionService : ITransactionService
{
    private readonly ITransactionRepository _repository;
    private readonly IMapper _mapper; // Injetando o AutoMapper

    public TransactionService(ITransactionRepository repository, IMapper mapper)
    {
        _repository = repository;
        _mapper = mapper;
    }

    public async Task CreateAsync(TransactionRequest request)
    {
        // Mágica acontece aqui: DTO -> Entidade
        var transaction = _mapper.Map<Transaction>(request);
        await _repository.AddAsync(transaction);
    }

   public async Task<IEnumerable<TransactionResponse>> GetAllAsync(DateTime? startDate = null, DateTime? endDate = null)
{
    var transactions = await _repository.GetAllAsync(startDate, endDate);
    
    // Mapeia para TransactionResponse em vez de TransactionRequest
    return _mapper.Map<IEnumerable<TransactionResponse>>(transactions);
}

   
    public async Task<bool> DeleteAsync(int id)
{
    var transaction = await _repository.GetByIdAsync(id);
    if (transaction == null) return false;

    await _repository.DeleteAsync(id);
    return true;
}

public async Task<bool> UpdateAsync(int id, TransactionRequest request)
{
    var existingTransaction = await _repository.GetByIdAsync(id);
    if (existingTransaction == null) return false;

    // O AutoMapper pode atualizar o objeto existente com os dados do Request
    _mapper.Map(request, existingTransaction);

    await _repository.UpdateAsync(existingTransaction);
    return true;
}

public async Task<DashboardResponse> GetBalanceAsync(DateTime? startDate = null, DateTime? endDate = null)
{
    // Ajuste de fim de dia para o filtro ser preciso
    if (endDate.HasValue) endDate = endDate.Value.Date.AddDays(1).AddTicks(-1);

    return await _repository.GetDashboardAsync(startDate, endDate);
}
}