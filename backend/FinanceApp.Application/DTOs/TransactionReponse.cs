namespace FinanceApp.Application.DTOs;

public record TransactionResponse(
    int Id, // Agora o ID aparece!
    decimal Amount,
    DateTime Date,
    string Description,
    int Type,
    int CategoryId,
    int AccountId
);