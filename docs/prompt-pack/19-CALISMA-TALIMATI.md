# 📋 Çalışma Talimatı — AI Asistana Verilecek Kurallar

> Bu dosya, AI asistanıyla çalışırken her oturumun başında verilmelidir.

---

```plaintext
You will work strictly according to the markdown prompt pack structure provided by me.

═══════════════════════════════════════
GENERAL RULES
═══════════════════════════════════════

1. Follow the prompt files in numeric order (02 → 03 → 04 → ... → 18).
2. Before generating code, list ALL files you will create with their full paths.
3. Generate code file by file, with the full file path as a comment at the top.
4. Do not skip any file that is required for compilation.
5. Generate complete, compilable code — not pseudo-code or partial snippets.
6. Always include using statements and namespace declarations.
7. At the end of each phase, provide:
   - ✅ Compile checklist (list of files that should exist)
   - 📦 Required NuGet packages (with versions)
   - 📦 Required npm packages (with versions)
   - 🖥️ CLI commands to run (build, migrate, test, etc.)
   - ⚠️ Likely errors and their fixes
8. Do not jump to the next phase unless the current phase is complete.
9. Respect the fixed architecture and v1 scope from 01-MASTER-KURALLAR.md.
10. Do not add advanced features outside the requested phase.

═══════════════════════════════════════
CODE QUALITY RULES
═══════════════════════════════════════

11. Code identifiers (classes, methods, variables, properties): English
12. Comments and explanations: Turkish
13. Keep code production-style and realistic.
14. Follow C# and TypeScript naming conventions:
    - C#: PascalCase for public members, camelCase for locals
    - TypeScript: camelCase for variables/functions, PascalCase for types/components
15. Use async/await properly.
16. Handle errors gracefully — no swallowed exceptions.
17. Use proper HTTP status codes in API responses.
18. Validate all inputs with FluentValidation (backend) or form validation (frontend).

═══════════════════════════════════════
ARCHITECTURE RULES
═══════════════════════════════════════

19. Never put business logic in Controllers — use Service layer.
20. Never reference Infrastructure from Domain.
21. Use dependency injection for all services.
22. Use interfaces for all service contracts.
23. Keep DTOs separate from entities.
24. Use Mapster for entity ↔ DTO mapping.

═══════════════════════════════════════
COMMUNICATION PROTOCOL
═══════════════════════════════════════

25. When I send a phase file (e.g., "03-DOMAIN-ENTITIES.md"), combine it with 01-MASTER-KURALLAR.md context and generate the requested output ONLY for that phase.
26. If a file from a previous phase needs modification, explicitly state:
    - Which file
    - What changed
    - Why
27. If you need clarification, ask before generating code.
28. After completing each phase, ask: "Build başarılı mı? Sonraki faza geçelim mi?"

═══════════════════════════════════════
PHASE COMPLETION TEMPLATE
═══════════════════════════════════════

At the end of each phase, output:

---
## ✅ Faz {N} Tamamlandı

### Oluşturulan Dosyalar:
- [ ] path/to/file1.cs
- [ ] path/to/file2.cs
- ...

### NuGet Paketleri:
| Paket | Versiyon | Proje |
|-------|----------|-------|
| ... | ... | ... |

### npm Paketleri:
| Paket | Versiyon |
|-------|----------|
| ... | ... |

### Çalıştırma Komutları:
```bash
...
```

### Olası Hatalar:
| Hata | Çözüm |
|------|-------|
| ... | ... |

### Sonraki Adım:
→ Faz {N+1}: {description}
---
```
