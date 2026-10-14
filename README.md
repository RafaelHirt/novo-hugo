# Novo HUGO · Simulador de custeio

Dashboard estático em português para simulação financeira. Identidade visual baseada no verde-azulado da SES e no azul do SUS, usando as referências enviadas pelo usuário. As imagens de `assets/` são adaptações das referências do hospital e da identidade institucional, convertidas para WebP e incluídas no próprio site.

## Interface

- Indicadores financeiros, projeção anual e capacidade de internação.
- Busca com ou sem acentos, filtro por categoria e opção de mostrar somente serviços alterados.
- Categorias recolhíveis, destaque das alterações e restauração de valores por serviço.
- Resumo financeiro fixo durante a edição e composição do custeio abaixo dos serviços.
- Edição em cartões no celular e em tabelas no computador, com navegação por teclado.
- Sem dependências de imagens, fontes ou scripts externos durante o uso.

## Desenvolvimento

Node.js 20 ou superior. Sem dependências externas de execução.

```sh
npm run dev
npm test
npm run build
```

Servidor na porta 3000 (ou `PORT`). Build em `dist`. No Netlify, conecte este repositório: `netlify.toml` configura build e diretório de publicação. Nenhum segredo é necessário.

## Dados e cálculos

`data.js` transcreve os dados da imagem HOSPITAL: HUGO — 4º TA ao TC 97/2024. Referência mensal: R$ 27.261.236,24. Identificação no dashboard: 4º Termo Aditivo em trâmite. A soma das linhas foi conferida em centavos e coincide com o total da imagem. Internação (enfermarias + UTI): R$ 15.077.012,05.

Os totais de linha da imagem são preservados como base, pois quantidades e custos unitários exibidos podem conter arredondamentos. Fórmula: total original × quantidade atual / original × custo unitário atual / original; internação também multiplica ocupação atual / original e cirurgia multiplica horas médias atuais / originais. A ocupação é percentual de 0 a 100. Os 406 leitos incluem somente enfermarias e UTI. Valores são mensais; o anual é uma projeção de 12 meses iguais. Não é uma proposta contratual e não incorpora inflação ou modelagem de custos fixos.

Valores monetários usam o padrão brasileiro (R$ 1.234,56), com duas casas decimais e totais somados em centavos. Custos unitários podem ser digitados com vírgula decimal ou colados com R$. O CSV usa ponto e vírgula como separador, vírgula decimal e duas casas nos valores monetários.

Os ajustes ficam no localStorage do navegador e podem ser restaurados ou exportados em CSV. A aba “4º T.A HUGO (Base de valores HUGOL)” aguarda dados; UTI, PS e Cirurgias utilizarão os valores atualmente previstos no HUGOL. Validar os dados com a planilha original antes de decisões financeiras.
