using AutoMapper;
using FinanceApp.Application.Interfaces;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;
using FinanceApp.Domain.Interfaces;

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
}