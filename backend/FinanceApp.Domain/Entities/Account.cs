namespace FinanceApp.Domain.Entities;

public class Account
{
    public int Id { get; private set; }
    public string Name { get; private set; } // Ex: "Carteira", "Nubank"
    public decimal Balance { get; private set; } // Saldo atual
    public int UserId { get; private set; }
    public User User { get; private set; }
    public ICollection<Transaction> Transactions { get; private set; }

    protected Account() { } // Construtor para o EF Core

    public Account(string name, int userId, decimal initialBalance = 0)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome da conta é obrigatório.");
        if (userId <= 0) throw new ArgumentException("Usuário inválido.");

        Name = name;
        UserId = userId;
        Balance = initialBalance;
    }

    internal void UpdateBalance(decimal amount)
    {
        Balance += amount;
    }
}