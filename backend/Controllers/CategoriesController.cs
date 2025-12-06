using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Backend.Data;
using Backend.Models;
using Backend.DTOs;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для управления категориями вещей
/// </summary>
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
    
    /// <summary>
    /// Получить все категории
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CategoryDto>>>> GetCategories([FromQuery] bool includeInactive = false)
    {
        var query = _context.Categories.AsQueryable();
        
        if (!includeInactive)
        {
            query = query.Where(c => c.IsActive);
        }
        
        var categories = await query
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                Icon = c.Icon,
                IsActive = c.IsActive,
                ItemsCount = c.Items.Count
            })
            .ToListAsync();
        
        return Ok(new ApiResponse<List<CategoryDto>>
        {
            Success = true,
            Data = categories
        });
    }
    
    /// <summary>
    /// Получить категорию по ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> GetCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id);
        
        if (category == null)
        {
            return NotFound(new ApiResponse<CategoryDto>
            {
                Success = false,
                Message = "Категория не найдена"
            });
        }
        
        return Ok(new ApiResponse<CategoryDto>
        {
            Success = true,
            Data = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Icon = category.Icon,
                IsActive = category.IsActive,
                ItemsCount = category.Items.Count
            }
        });
    }
    
    /// <summary>
    /// Создать новую категорию (только Admin)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> CreateCategory([FromBody] CreateCategoryRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new ApiResponse<CategoryDto>
            {
                Success = false,
                Message = "Название категории обязательно"
            });
        }
        
        var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.ToLower());
        if (exists)
        {
            return BadRequest(new ApiResponse<CategoryDto>
            {
                Success = false,
                Message = "Категория с таким названием уже существует"
            });
        }
        
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description ?? string.Empty,
            Icon = request.Icon ?? "📦"
        };
        
        _context.Categories.Add(category);
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<CategoryDto>
        {
            Success = true,
            Message = "Категория создана",
            Data = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Icon = category.Icon,
                IsActive = category.IsActive,
                ItemsCount = 0
            }
        });
    }
    
    /// <summary>
    /// Обновить категорию (только Admin)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> UpdateCategory(int id, [FromBody] UpdateCategoryRequest request)
    {
        var category = await _context.Categories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id);
        
        if (category == null)
        {
            return NotFound(new ApiResponse<CategoryDto>
            {
                Success = false,
                Message = "Категория не найдена"
            });
        }
        
        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            var exists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == request.Name.ToLower() && c.Id != id);
            if (exists)
            {
                return BadRequest(new ApiResponse<CategoryDto>
                {
                    Success = false,
                    Message = "Категория с таким названием уже существует"
                });
            }
            category.Name = request.Name;
        }
        
        if (request.Description != null) category.Description = request.Description;
        if (request.Icon != null) category.Icon = request.Icon;
        if (request.IsActive.HasValue) category.IsActive = request.IsActive.Value;
        
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<CategoryDto>
        {
            Success = true,
            Message = "Категория обновлена",
            Data = new CategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                Icon = category.Icon,
                IsActive = category.IsActive,
                ItemsCount = category.Items.Count
            }
        });
    }
    
    /// <summary>
    /// Удалить категорию (только Admin)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCategory(int id)
    {
        var category = await _context.Categories
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.Id == id);
        
        if (category == null)
        {
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = "Категория не найдена"
            });
        }
        
        if (category.Items.Any())
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = "Нельзя удалить категорию с вещами. Сначала переместите вещи в другую категорию."
            });
        }
        
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = "Категория удалена"
        });
    }
}
