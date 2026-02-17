namespace FinanceApp.Domain.Entities;

public class Transaction
{
    // O ID geralmente é privado para o set, pois o Banco de Dados cuidará disso
    public int Id { get; private set; }
    public decimal Amount { get; private set; }
    public DateTime Date { get; private set; }
    public string Description { get; private set; }
    public TransactionType Type { get; private set; }
    public int CategoryId { get; private set; }

    // Construtor para garantir que a transação nasça válida
    public Transaction(decimal amount, DateTime date, string description, TransactionType type, int categoryId)
    {
        if (amount <= 0) 
            throw new ArgumentException("O valor deve ser maior que zero.");
        
        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("A descrição é obrigatória.");

        Amount = amount;
        Date = date;
        Description = description;
        Type = type;
        CategoryId = categoryId;
    }
}

public enum TransactionType
{
    Inflow = 1,  // Entrada
    Outflow = 2  // Saída
}