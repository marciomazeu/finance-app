using AutoMapper;
using FinanceApp.Application.DTOs;
using FinanceApp.Domain.Entities;

namespace FinanceApp.Application.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // De Entidade para DTO (Usado no GET)
        CreateMap<Transaction, TransactionRequest>();

        // De DTO para Entidade (Usado no POST)
        // Como sua Entidade Transaction usa construtor com lógica, 
        // o AutoMapper é inteligente o suficiente para mapear os nomes das propriedades do DTO 
        // para os parâmetros do construtor se eles forem iguais.
        CreateMap<TransactionRequest, Transaction>();

         // De Entidade para o novo DTO de Resposta
        CreateMap<Transaction, TransactionResponse>();
    }
   
}