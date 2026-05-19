
using FinanceApp.Domain.Entities;

public class Category
{
    public int Id { get; private set; }
    public string Name { get; private set; }
    public ICollection<Transaction> Transactions { get; private set; } = new List<Transaction>();

    
    // Construtor para o EF Core (Vazio e Protegido)
    private Category(){}

    // Construtor para garantir que a categoria nasça válida
    public Category(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("O nome da categoria é obrigatório.");

        Name = name;
    }
}