# 3D Print Shop Express

Crie um site de e-commerce moderno, responsivo e focado em conversão para venda de produtos de impressão 3D, sem necessidade de login para o cliente.

🎯 OBJETIVO

Permitir que o cliente realize pedidos de forma simples, com geração automática de código e pagamento via PIX manual, com envio de comprovante.

🏠 HOME

Banner principal com vídeo (autoplay, sem som) mostrando impressões 3D ou produtos

Logo abaixo: listagem de produtos

Seção de categorias

Seção de depoimentos em carrossel

Seção com feed do Instagram em grid moderno (visual estilo vitrine, com animações leves e imagens clicáveis)

🛍️ PRODUTOS

Cada produto deve conter:

Imagem

Nome

Descrição

Preço

Peso e dimensões

Estoque (não visível ao cliente)

Regras:

Se estoque = 0 → mostrar “ESGOTADO”

Ao gerar pedido → diminuir estoque automaticamente

🚚 FRETE

Opções:

Entrega Grande Vitória:

Valor fixo configurado pelo admin

Correios:

Campo para CEP com validação

Cálculo automático via API (PAC e SEDEX)

Exibir valor e prazo

🧾 PEDIDO

Ao finalizar:

Criar pedido automaticamente

Gerar código único (ex: PED-A7K92X)

Salvar:

Produtos

Valores

Frete

Total

Status

Data

📢 PÓS-PEDIDO

Exibir:

Código do pedido (em destaque)

Resumo completo

Valor total

Chave PIX

Instruções claras de pagamento

Botões:

“Já paguei”

“Enviar pedido no WhatsApp” (com mensagem automática contendo resumo do pedido)

💰 PAGAMENTO

PIX manual

Exibir chave PIX

Status inicial: “Análise de pagamento”

📊 STATUS

Análise de pagamento

Pago

Em produção

Em fase de entrega

Entregue

Exibição:

Linha de progresso visual (timeline)

Cores para cada etapa

🔍 CONSULTAR PEDIDO

Aba: “Meus Pedidos”

Campo:

Inserir código

Exibir:

Dados completos

Status visual

Botão “Enviar comprovante”

📷 COMPROVANTE

Upload de imagem (jpg/png)

Mensagem de sucesso após envio

Vincular ao pedido

Exibir no painel admin

⭐ DEPOIMENTOS

Nome

Texto

Nota (estrelas)

Carrossel automático

🗂️ CATEGORIAS

Criar / editar / excluir

Organização de produtos

🔐 ADMIN

Produtos:

CRUD completo

Controle de estoque

Pedidos:

Visualizar pedidos

Ver comprovantes

Alterar status manualmente

Categorias:

Gerenciar

Depoimentos:

Gerenciar

Configurações:

Frete fixo (Grande Vitória)

CEP de origem

📊 DASHBOARD

Faturamento

Pedidos

Pendentes

Mais vendidos

🎨 DESIGN

Moderno

Limpo

Responsivo

Foco em conversão

Animações suaves

Destaque nos botões de ação

⚙️ REGRAS

Sem login obrigatório

Fluxo simples e rápido

Código organizado

Estrutura pronta para crescimento futuro

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pix-flow-print.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/64837f78-82f1-42e2-ad6f-3eb31fe2e473).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
