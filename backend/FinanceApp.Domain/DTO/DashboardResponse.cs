namespace FinanceApp.Domain.DTOs;

public record DashboardResponse(
    decimal TotalIncomes,
    decimal TotalExpenses,
    decimal Balance
);