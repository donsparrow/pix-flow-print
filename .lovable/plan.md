# Aceitar GIF no upload de imagens de produto

Menor alteração possível: um único arquivo, `src/pages/admin/AdminProdutos.tsx`. Nada de banco, storage, políticas, componentes novos ou dependências novas.

## Verificação prévia (já confirmada)

O bucket `produtos` não bloqueia GIF:

```text
id: produtos | public: true | file_size_limit: null | allowed_mime_types: null
```

As regras de upload do bucket exigem apenas "ser admin" — nenhuma checagem de tipo de arquivo ou extensão. Portanto um GIF de 10 MB passa normalmente; nenhuma mudança de storage é necessária.

## O que muda

### 1. `uploadImg` — aceitar GIF, com limite próprio de 10 MB

- `tiposOk` passa a incluir `"image/gif"`.
- O limite de tamanho deixa de ser fixo em 5 MB: 5 MB para JPG/PNG/WEBP, 10 MB quando o arquivo é GIF.
- Mensagens de erro atualizadas: `"use JPG, PNG, WEBP ou GIF"` e `"GIF: até 10MB"`.
- Nome do arquivo, bucket `produtos`, `cacheControl: "31536000"` e `contentType: f.type` permanecem idênticos.

### 2. Input de upload (`id="img-up"`)

- Atributo `accept` passa a incluir `image/gif`, para que a janela de seleção do sistema permita escolher GIF.

### 3. Nada mais

Ordenação, "definir capa", mover/remover imagens, campo de link externo, previews, salvamento e todo o resto do arquivo ficam exatamente como estão. Nenhuma outra tela é tocada.

## Linhas exatas que serão alteradas

Hoje (função `uploadImg`):

```text
const tiposOk = ["image/jpeg", "image/png", "image/webp"];
...
if (!tiposOk.includes(f.type)) { toast.error(`${f.name}: use JPG, PNG ou WEBP`); continue; }
if (f.size > 5 * 1024 * 1024) { toast.error(`${f.name}: até 5MB`); continue; }
```

Depois:

```text
const tiposOk = ["image/jpeg", "image/png", "image/webp", "image/gif"];
...
if (!tiposOk.includes(f.type)) { toast.error(`${f.name}: use JPG, PNG, WEBP ou GIF`); continue; }
const limite = f.type === "image/gif" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
if (f.size > limite) { toast.error(f.type === "image/gif" ? `${f.name}: GIF: até 10MB` : `${f.name}: até 5MB`); continue; }
```

Hoje (input):

```text
<input type="file" accept="image/jpeg,image/png,image/webp" id="img-up" multiple ... />
```

Depois:

```text
<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" id="img-up" multiple ... />
```

## Item marcado e NÃO alterado

Existe uma linha de ajuda ao lado do botão que hoje diz `JPG, PNG ou WEBP · até 5MB cada · vários arquivos`. Ela continuaria desatualizada, mas **não será alterada** neste plano — se quiser que ela também cite GIF e os 10 MB, é só dizer.
