using System;
using Microsoft.EntityFrameworkCore;
using FinanceApp.Infrastructure.Data;
using FinanceApp.Domain.Entities;
using FinanceApp.Application.Interfaces;
using FinanceApp.Application.Services;
using FinanceApp.Domain.Interfaces;
using FinanceApp.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

    // Injeção de Dependência do Service
builder.Services.AddScoped<ITransactionRepository, TransactionRepository>();
builder.Services.AddScoped<ITransactionService, TransactionService>();

builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
    
var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();


// Bloco de Seed Temporário
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try 
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.EnsureCreated();

        if (!context.Users.Any())
        {
            // 1. Criar um Usuário (ajuste conforme o seu construtor de User)
            var defaultUser = new User("Usuario Padrao", "email@teste.com", "hash_de_teste_123");
            context.Users.Add(defaultUser);
            context.SaveChanges(); // Salvamos para gerar o ID do usuário

            // 2. Criar a Categoria
            var category = new Category("Geral");
            context.Categories.Add(category);

            // 3. Criar a Conta usando o ID do usuário criado
            // Conforme o erro: Account(string name, int userId, decimal balance)
            var account = new FinanceApp.Domain.Entities.Account("Carteira", defaultUser.Id, 0m);
            context.Accounts.Add(account);

            context.SaveChanges();
            Console.WriteLine("Seed executado com sucesso!");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erro no Seed: {ex.Message}");
    }
}

app.Run();


