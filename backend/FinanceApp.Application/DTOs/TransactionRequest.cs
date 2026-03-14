namespace FinanceApp.Application.DTOs;

public record TransactionRequest(
    decimal Amount,
    DateTime Date,
    string Description,
    int Type, // 1 para Inflow, 2 para Outflow
    int CategoryId,
    int AccountId
);