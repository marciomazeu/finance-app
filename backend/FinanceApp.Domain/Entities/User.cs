namespace FinanceApp.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }
    public DateTime CreatedAt { get; set; }

// Propriedade de navegação: Um usuário terá muitas transações (ou contas)
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();

    public User() { } // Para o EF Core

    public User(string name, string email, string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Nome é obrigatório.");
        if (string.IsNullOrWhiteSpace(email) || !email.Contains("@")) throw new ArgumentException("E-mail inválido.");
        if (string.IsNullOrWhiteSpace(passwordHash)) throw new ArgumentException("O hash da senha é obrigatório.");

        Name = name;
        Email = email.ToLower().Trim();
        PasswordHash = passwordHash;
        CreatedAt = DateTime.UtcNow; // Sempre use UTC em sistemas que podem escalar
    }
}