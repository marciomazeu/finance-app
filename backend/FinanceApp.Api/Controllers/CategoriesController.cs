using FinanceApp.Infrastructure.Data;
using FinanceApp.Domain.Entities; // Adicione este using
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FinanceApp.Application.DTOs;

namespace FinanceApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CategoryRequest request)
    {
        // Agora usamos o request.Name que vem do JSON {"name": "..."}
        var category = new Category(request.Name);
        
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        
        return Ok(category);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // O ToListAsync() vai funcionar agora que temos o using do EntityFrameworkCore
        return Ok(await _context.Categories.ToListAsync());
    }

}