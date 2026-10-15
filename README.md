# Novo HUGO · Demonstração de custeio

Dashboard em português para demonstração financeira, com acesso por senha validado no servidor. Identidade visual baseada no verde-azulado da SES e no azul do SUS, usando as referências enviadas pelo usuário. As imagens de `assets/` são adaptações das referências do hospital e da identidade institucional, convertidas para WebP e incluídas no próprio site.

## Interface

- Indicadores financeiros e projeção anual, com resumo fixo e compacto durante a rolagem.
- Leitos de enfermaria (UI e PS Observação), UTI e total: originalmente 336 + 70 = 406.
- Busca com ou sem acentos, filtro por categoria e opção de mostrar somente serviços alterados.
- Categorias recolhíveis, destaque das alterações e restauração de valores por serviço.
- Resumo financeiro fixo durante a edição e composição do custeio abaixo dos serviços.
- Edição em cartões no celular e em tabelas no computador, com navegação por teclado.
- Aba Comparativo com resumo por categoria e serviços detalhados opcionais, sem coluna de ocupação. Os valores HUGOL e as diferenças permanecem pendentes até o recebimento da base.
- Indicador de conexão com animação suave, respeitando a preferência por movimentos reduzidos.
- Sem dependências de imagens, fontes ou scripts externos durante o uso.

## Desenvolvimento

Node.js 20 ou superior. Sem dependências externas de execução. Defina `DASHBOARD_PASSWORD` no ambiente de execução antes de iniciar o servidor; não registre o valor em arquivos versionados ou comandos salvos. Arquivos `.env` estão ignorados pelo Git, mas não são carregados automaticamente por `npm run dev`.

```sh
npm run dev
npm test
npm run build
```

Servidor na porta 3000 (ou `PORT`). Build em `dist`. Os testes usam senhas temporárias aleatórias em memória e não precisam da senha de produção. O servidor local aplica a mesma validação de acesso usada no Netlify.

## Acesso e publicação no Netlify

`netlify.toml` configura o build, o diretório de publicação e a Edge Function `access` para todas as rotas. A senha não faz parte do JavaScript entregue ao navegador nem do build estático.

1. Em **Project configuration → Environment variables**, adicione `DASHBOARD_PASSWORD` com a senha de acesso definida para o painel. Marque o valor como secreto e disponibilize-o às funções no contexto Production (e aos demais contextos que precisarem de acesso).
2. Inicie um novo deploy depois de salvar a variável.
3. Confira o login, o acesso ao painel e o botão Sair no site publicado.

Não há nome de usuário. A sessão dura oito horas e usa cookie assinado, HttpOnly, SameSite=Strict e Secure em HTTPS. Alterar a senha invalida as sessões anteriores. Páginas e dados protegidos não podem ser armazenados no cache compartilhado. Sem a variável, o servidor retorna acesso indisponível e mantém os dados bloqueados; erros da Edge Function não liberam arquivos estáticos. Somente as duas imagens institucionais e o script de apresentação do login são públicos. Há limitação de tentativas de login por IP em cada instância da função.

A autenticação foi verificada no servidor local e no adaptador da Edge Function; a confirmação no Netlify exige a variável e um deploy na plataforma.

## Dados e cálculos

`data.js` transcreve os dados da imagem HOSPITAL: HUGO — 4º TA ao TC 97/2024. Referência mensal: R$ 27.261.236,24. Identificação no dashboard: 4º Termo Aditivo em trâmite. A soma das linhas foi conferida em centavos e coincide com o total da imagem. Internação (enfermarias + UTI): R$ 15.077.012,05.

Os totais de linha da imagem são preservados como base, pois quantidades e custos unitários exibidos podem conter arredondamentos. Fórmula: total original × quantidade atual / original × custo unitário atual / original; internação também multiplica ocupação atual / original e cirurgia multiplica horas médias atuais / originais. A ocupação é percentual de 0 a 100. Os 406 leitos incluem somente enfermarias e UTI. Valores são mensais; o anual é uma projeção de 12 meses iguais. Não é uma proposta contratual e não incorpora inflação ou modelagem de custos fixos.

Valores monetários usam o padrão brasileiro (R$ 1.234,56), com duas casas decimais e totais somados em centavos. Custos unitários podem ser digitados com vírgula decimal ou colados com R$. O CSV usa ponto e vírgula como separador, vírgula decimal e duas casas nos valores monetários.

Os ajustes ficam no localStorage do navegador e podem ser restaurados ou exportados em CSV. A aba “4º T.A HUGO (Base de valores HUGOL)” aguarda dados; UTI, PS e Cirurgias utilizarão os valores atualmente previstos no HUGOL. Validar os dados com a planilha original antes de decisões financeiras.
