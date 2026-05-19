namespace FinanceApp.Domain.DTOs;

public record CategorySummaryResponse(
    int CategoryId,
    string CategoryName,
    decimal TotalAmount,
    decimal Percentage // Útil para gráficos de pizza!
);